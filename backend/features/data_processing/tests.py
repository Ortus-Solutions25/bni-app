from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from datetime import date
import pandas as pd
import tempfile
import os
from pathlib import Path

from chapters.models import Chapter, Member
from analytics.models import Referral, OneToOne, TYFCB
from data_processing.services import ExcelProcessorService
from data_processing.utils import MatrixGenerator, NameMatcher, DataValidator


class MemberModelTests(TestCase):
    """Test Member model functionality."""
    
    def setUp(self):
        self.chapter = Chapter.objects.create(
            name="Test Chapter",
            location="Test Location"
        )
    
    def test_member_creation(self):
        """Test member creation and name normalization."""
        member = Member.objects.create(
            chapter=self.chapter,
            first_name="John",
            last_name="Doe",
            business_name="Test Business"
        )
        
        self.assertEqual(member.full_name, "John Doe")
        self.assertEqual(member.normalized_name, "john doe")
    
    def test_name_normalization(self):
        """Test name normalization logic."""
        test_cases = [
            ("Mr. John Doe Jr.", "john doe"),
            ("JANE SMITH", "jane smith"),
            ("Dr. Robert Johnson III", "robert johnson"),
            ("  Mary   Wilson  ", "mary wilson"),
        ]
        
        for input_name, expected in test_cases:
            with self.subTest(input_name=input_name):
                normalized = Member.normalize_name(input_name)
                self.assertEqual(normalized, expected)


class NameMatcherTests(TestCase):
    """Test NameMatcher utility functions."""
    
    def setUp(self):
        self.chapter = Chapter.objects.create(
            name="Test Chapter",
            location="Test Location"
        )
        
        # Create test members
        self.members = [
            Member.objects.create(
                chapter=self.chapter,
                first_name="John",
                last_name="Doe"
            ),
            Member.objects.create(
                chapter=self.chapter,
                first_name="Jane",
                last_name="Smith"
            ),
            Member.objects.create(
                chapter=self.chapter,
                first_name="Robert",
                last_name="Johnson"
            ),
        ]
    
    def test_create_fuzzy_variants(self):
        """Test fuzzy variant creation."""
        variants = NameMatcher.create_fuzzy_variants("John Doe")
        expected_variants = ["john doe", "john", "doe", "j. doe", "j doe"]
        
        for variant in expected_variants:
            self.assertIn(variant, variants)
    
    def test_find_best_match(self):
        """Test best match finding."""
        # Exact match
        match = NameMatcher.find_best_match("John Doe", self.members)
        self.assertEqual(match.first_name, "John")
        
        # Fuzzy match
        match = NameMatcher.find_best_match("J. Doe", self.members)
        self.assertEqual(match.first_name, "John")
        
        # No match
        match = NameMatcher.find_best_match("Unknown Person", self.members)
        self.assertIsNone(match)


class MatrixGeneratorTests(TestCase):
    """Test matrix generation functionality."""
    
    def setUp(self):
        self.chapter = Chapter.objects.create(
            name="Test Chapter",
            location="Test Location"
        )
        
        # Create test members
        self.member1 = Member.objects.create(
            chapter=self.chapter,
            first_name="John",
            last_name="Doe"
        )
        self.member2 = Member.objects.create(
            chapter=self.chapter,
            first_name="Jane",
            last_name="Smith"
        )
        self.member3 = Member.objects.create(
            chapter=self.chapter,
            first_name="Bob",
            last_name="Wilson"
        )
        
        self.members = [self.member1, self.member2, self.member3]
        
        # Create test data
        self.referrals = [
            Referral.objects.create(giver=self.member1, receiver=self.member2),
            Referral.objects.create(giver=self.member1, receiver=self.member3),
            Referral.objects.create(giver=self.member2, receiver=self.member1),
        ]
        
        self.one_to_ones = [
            OneToOne.objects.create(member1=self.member1, member2=self.member2),
            OneToOne.objects.create(member1=self.member2, member2=self.member3),
        ]
        
        self.tyfcbs = [
            TYFCB.objects.create(receiver=self.member1, amount=100.00),
            TYFCB.objects.create(receiver=self.member2, giver=self.member1, amount=250.00),
        ]
    
    def test_referral_matrix_generation(self):
        """Test referral matrix generation."""
        generator = MatrixGenerator(self.members)
        matrix = generator.generate_referral_matrix(self.referrals)
        
        # Check matrix dimensions
        self.assertEqual(matrix.shape, (3, 3))
        
        # Check specific values
        self.assertEqual(matrix.loc["John Doe", "Jane Smith"], 1)
        self.assertEqual(matrix.loc["John Doe", "Bob Wilson"], 1)
        self.assertEqual(matrix.loc["Jane Smith", "John Doe"], 1)
        self.assertEqual(matrix.loc["Jane Smith", "Bob Wilson"], 0)
    
    def test_one_to_one_matrix_generation(self):
        """Test one-to-one matrix generation."""
        generator = MatrixGenerator(self.members)
        matrix = generator.generate_one_to_one_matrix(self.one_to_ones)
        
        # Check matrix dimensions
        self.assertEqual(matrix.shape, (3, 3))
        
        # Check bidirectional entries
        self.assertEqual(matrix.loc["John Doe", "Jane Smith"], 1)
        self.assertEqual(matrix.loc["Jane Smith", "John Doe"], 1)
        self.assertEqual(matrix.loc["Jane Smith", "Bob Wilson"], 1)
        self.assertEqual(matrix.loc["Bob Wilson", "Jane Smith"], 1)
    
    def test_combination_matrix_generation(self):
        """Test combination matrix generation."""
        generator = MatrixGenerator(self.members)
        matrix = generator.generate_combination_matrix(self.referrals, self.one_to_ones)
        
        # Check combination values
        # John -> Jane: has both referral and one-to-one (value 3)
        self.assertEqual(matrix.loc["John Doe", "Jane Smith"], 3)
        
        # John -> Bob: has referral only (value 2)
        self.assertEqual(matrix.loc["John Doe", "Bob Wilson"], 2)
    
    def test_tyfcb_summary_generation(self):
        """Test TYFCB summary generation."""
        generator = MatrixGenerator(self.members)
        summary = generator.generate_tyfcb_summary(self.tyfcbs)
        
        # Check DataFrame structure
        self.assertIn('Member', summary.columns)
        self.assertIn('TYFCB_Received_Amount', summary.columns)
        
        # Check specific values
        john_row = summary[summary['Member'] == 'John Doe'].iloc[0]
        self.assertEqual(john_row['TYFCB_Received_Amount'], 100.0)
        self.assertEqual(john_row['TYFCB_Given_Amount'], 250.0)


class ExcelProcessorServiceTests(TestCase):
    """Test Excel processing service."""
    
    def setUp(self):
        self.chapter = Chapter.objects.create(
            name="Test Chapter",
            location="Test Location"
        )
        
        # Create test members
        self.member1 = Member.objects.create(
            chapter=self.chapter,
            first_name="John",
            last_name="Doe"
        )
        self.member2 = Member.objects.create(
            chapter=self.chapter,
            first_name="Jane",
            last_name="Smith"
        )
    
    def create_test_excel_file(self, data):
        """Helper method to create test Excel file."""
        df = pd.DataFrame(data)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            df.to_excel(tmp_file.name, index=False, header=False)
            return tmp_file.name
    
    def test_process_referral_data(self):
        """Test processing referral data from Excel."""
        test_data = [
            ["Giver", "Receiver", "Type"],  # Header row
            ["John Doe", "Jane Smith", "Referral"],
            ["Jane Smith", "John Doe", "Referral"],
        ]
        
        excel_file = self.create_test_excel_file(test_data)
        
        try:
            processor = ExcelProcessorService(self.chapter)
            result = processor.process_excel_file(excel_file)
            
            self.assertTrue(result['success'])
            self.assertEqual(result['referrals_created'], 2)
            self.assertEqual(result['one_to_ones_created'], 0)
            self.assertEqual(result['tyfcbs_created'], 0)
            
        finally:
            if os.path.exists(excel_file):
                os.unlink(excel_file)
    
    def test_process_one_to_one_data(self):
        """Test processing one-to-one data from Excel."""
        test_data = [
            ["Member1", "Member2", "Type"],  # Header row
            ["John Doe", "Jane Smith", "One to One"],
        ]
        
        excel_file = self.create_test_excel_file(test_data)
        
        try:
            processor = ExcelProcessorService(self.chapter)
            result = processor.process_excel_file(excel_file)
            
            self.assertTrue(result['success'])
            self.assertEqual(result['one_to_ones_created'], 1)
            
        finally:
            if os.path.exists(excel_file):
                os.unlink(excel_file)
    
    def test_process_tyfcb_data(self):
        """Test processing TYFCB data from Excel."""
        test_data = [
            ["Giver", "Receiver", "Type", "", "Amount", "", "Detail"],  # Header row
            ["", "John Doe", "TYFCB", "", "500.00", "", ""],
        ]
        
        excel_file = self.create_test_excel_file(test_data)
        
        try:
            processor = ExcelProcessorService(self.chapter)
            result = processor.process_excel_file(excel_file)
            
            self.assertTrue(result['success'])
            self.assertEqual(result['tyfcbs_created'], 1)
            
        finally:
            if os.path.exists(excel_file):
                os.unlink(excel_file)
    
    def test_invalid_member_handling(self):
        """Test handling of invalid member names."""
        test_data = [
            ["Giver", "Receiver", "Type"],  # Header row
            ["Unknown Person", "Jane Smith", "Referral"],
            ["John Doe", "Another Unknown", "Referral"],
        ]
        
        excel_file = self.create_test_excel_file(test_data)
        
        try:
            processor = ExcelProcessorService(self.chapter)
            result = processor.process_excel_file(excel_file)
            
            # Should still succeed but with warnings
            self.assertTrue(result['success'])
            self.assertEqual(result['referrals_created'], 0)  # No valid referrals
            self.assertTrue(len(result['warnings']) > 0)
            
        finally:
            if os.path.exists(excel_file):
                os.unlink(excel_file)


class DataValidatorTests(TestCase):
    """Test data validation utilities."""
    
    def setUp(self):
        self.chapter = Chapter.objects.create(
            name="Test Chapter",
            location="Test Location"
        )
        
        self.member1 = Member.objects.create(
            chapter=self.chapter,
            first_name="John",
            last_name="Doe"
        )
        self.member2 = Member.objects.create(
            chapter=self.chapter,
            first_name="Jane",
            last_name="Smith"
        )
    
    def test_validate_referrals(self):
        """Test referral validation."""
        referrals = [
            Referral(giver=self.member1, receiver=self.member2),
            Referral(giver=self.member1, receiver=self.member1),  # Self-referral
        ]
        
        issues = DataValidator.validate_referrals(referrals)
        
        self.assertEqual(len(issues['self_referrals']), 1)
        self.assertEqual(issues['self_referrals'][0].giver, self.member1)
    
    def test_validate_one_to_ones(self):
        """Test one-to-one validation."""
        one_to_ones = [
            OneToOne(member1=self.member1, member2=self.member2),
            OneToOne(member1=self.member1, member2=self.member1),  # Self-meeting
        ]
        
        issues = DataValidator.validate_one_to_ones(one_to_ones)
        
        self.assertEqual(len(issues['self_meetings']), 1)
        self.assertEqual(issues['self_meetings'][0].member1, self.member1)
    
    def test_generate_quality_report(self):
        """Test quality report generation."""
        referrals = [Referral(giver=self.member1, receiver=self.member2)]
        one_to_ones = [OneToOne(member1=self.member1, member2=self.member2)]
        tyfcbs = [TYFCB(receiver=self.member1, amount=100.0)]
        
        report = DataValidator.generate_quality_report(
            referrals, one_to_ones, tyfcbs
        )
        
        self.assertEqual(report['total_records'], 3)
        self.assertEqual(report['total_issues'], 0)
        self.assertEqual(report['overall_quality_score'], 100.0)


class APIEndpointTests(TestCase):
    """Test API endpoints."""
    
    def setUp(self):
        from django.contrib.auth.models import User
        
        self.chapter = Chapter.objects.create(
            name="Test Chapter",
            location="Test Location"
        )
        
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass'
        )
        
        self.member1 = Member.objects.create(
            chapter=self.chapter,
            first_name="John",
            last_name="Doe"
        )
    
    def test_matrix_endpoints_require_auth(self):
        """Test that matrix endpoints require authentication."""
        from django.urls import reverse
        
        url = reverse('referral_matrix', kwargs={'chapter_id': self.chapter.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 401)  # Unauthorized
    
    def test_authenticated_matrix_access(self):
        """Test authenticated access to matrix endpoints."""
        from django.urls import reverse
        
        self.client.force_login(self.user)
        
        url = reverse('referral_matrix', kwargs={'chapter_id': self.chapter.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('members', data)
        self.assertIn('matrix', data)
