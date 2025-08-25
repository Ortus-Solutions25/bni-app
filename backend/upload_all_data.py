#!/usr/bin/env python
"""
Script to upload all PALMS data for all BNI chapters
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from pathlib import Path
from django.core.files.uploadedfile import SimpleUploadedFile
from data_processing.services import ExcelProcessorService
from chapters.models import Chapter

# Define the data directory
DATA_DIR = Path('/Users/nat/dev/freelance/pankaj_gupta/bni-app/frontend/public/needed-data/august-slip-audit-reports')

# Chapter mapping (folder name to database chapter name)
CHAPTER_MAPPING = {
    'continental': 'BNI Continental',
    'elevate': 'BNI Elevate', 
    'energy': 'BNI Energy',
    'excelerate': 'BNI Excelerate',
    'givers': 'BNI Givers',
    'gladiators': 'BNI Gladiators',
    'legends': 'BNI Legends',
    'synergy': 'BNI Synergy',
    'united': 'BNI United'
}

def process_chapter_data(chapter_folder, chapter_name):
    """Process all PALMS files for a single chapter"""
    print(f"\n{'='*60}")
    print(f"Processing {chapter_name}")
    print(f"{'='*60}")
    
    try:
        # Get the chapter from database
        chapter = Chapter.objects.get(name=chapter_name)
        service = ExcelProcessorService(chapter)
        
        # Get all .xls files in the chapter folder
        folder_path = DATA_DIR / chapter_folder
        xls_files = list(folder_path.glob('*.xls'))
        
        if not xls_files:
            print(f"No .xls files found in {folder_path}")
            return
        
        print(f"Found {len(xls_files)} files to process")
        
        total_referrals = 0
        total_otos = 0
        total_tyfcbs = 0
        
        for file_path in xls_files:
            print(f"\nProcessing: {file_path.name}")
            
            # Read the file
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # Create uploaded file object
            uploaded_file = SimpleUploadedFile(
                name=file_path.name,
                content=file_content,
                content_type='application/vnd.ms-excel'
            )
            
            # Process the file
            result = service.process_monthly_report(
                slip_audit_file=uploaded_file,
                member_names_file=None,
                month_year='2025-08'  # August 2025
            )
            
            if result['success']:
                print(f"  ✅ Success!")
                print(f"     Referrals: {result['referrals_created']}")
                print(f"     One-to-Ones: {result['one_to_ones_created']}")
                print(f"     TYFCBs: {result['tyfcbs_created']}")
                
                total_referrals += result['referrals_created']
                total_otos += result['one_to_ones_created']
                total_tyfcbs += result['tyfcbs_created']
            else:
                print(f"  ❌ Failed: {result.get('error', 'Unknown error')}")
        
        print(f"\n{chapter_name} Summary:")
        print(f"  Total Referrals: {total_referrals}")
        print(f"  Total One-to-Ones: {total_otos}")
        print(f"  Total TYFCBs: {total_tyfcbs}")
        
        return {
            'chapter': chapter_name,
            'referrals': total_referrals,
            'one_to_ones': total_otos,
            'tyfcbs': total_tyfcbs
        }
        
    except Chapter.DoesNotExist:
        print(f"❌ Chapter '{chapter_name}' not found in database")
        return None
    except Exception as e:
        print(f"❌ Error processing {chapter_name}: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Process all chapters"""
    print("Starting PALMS data upload for all BNI chapters")
    print("="*60)
    
    # Clear existing data first (optional - comment out to keep existing data)
    from analytics.models import Referral, OneToOne, TYFCB
    from chapters.models import MonthlyReport, MemberMonthlyStats
    
    print("Clearing existing data...")
    Referral.objects.all().delete()
    OneToOne.objects.all().delete()
    TYFCB.objects.all().delete()
    MonthlyReport.objects.all().delete()
    MemberMonthlyStats.objects.all().delete()
    print("Existing data cleared")
    
    # Process each chapter
    results = []
    for folder_name, chapter_name in CHAPTER_MAPPING.items():
        result = process_chapter_data(folder_name, chapter_name)
        if result:
            results.append(result)
    
    # Print overall summary
    print("\n" + "="*60)
    print("OVERALL SUMMARY")
    print("="*60)
    
    total_all_referrals = 0
    total_all_otos = 0
    total_all_tyfcbs = 0
    
    for result in results:
        print(f"{result['chapter']:20} - R: {result['referrals']:4} | OTO: {result['one_to_ones']:4} | TYFCB: {result['tyfcbs']:4}")
        total_all_referrals += result['referrals']
        total_all_otos += result['one_to_ones']
        total_all_tyfcbs += result['tyfcbs']
    
    print("-"*60)
    print(f"{'TOTAL':20} - R: {total_all_referrals:4} | OTO: {total_all_otos:4} | TYFCB: {total_all_tyfcbs:4}")
    print("\n✅ All data uploaded successfully!")

if __name__ == '__main__':
    main()