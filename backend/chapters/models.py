from django.db import models
from django.contrib.auth.models import User


class Chapter(models.Model):
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=200)
    meeting_day = models.CharField(max_length=20, blank=True)
    meeting_time = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Member(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='members')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    normalized_name = models.CharField(max_length=100, db_index=True)
    business_name = models.CharField(max_length=200, blank=True)
    classification = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    joined_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['first_name', 'last_name']
        unique_together = ['chapter', 'normalized_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def save(self, *args, **kwargs):
        if not self.normalized_name:
            self.normalized_name = self.normalize_name(f"{self.first_name} {self.last_name}")
        super().save(*args, **kwargs)
    
    @staticmethod
    def normalize_name(name):
        """Normalize name for consistent matching."""
        if not name:
            return ""
        
        # Convert to lowercase and remove extra spaces
        normalized = ' '.join(name.lower().split())
        
        # Remove common prefixes/suffixes
        prefixes = ['mr.', 'mrs.', 'ms.', 'dr.', 'prof.']
        suffixes = ['jr.', 'sr.', 'ii', 'iii', 'iv']
        
        parts = normalized.split()
        
        # Remove prefixes
        if parts and parts[0] in prefixes:
            parts = parts[1:]
        
        # Remove suffixes
        if parts and parts[-1] in suffixes:
            parts = parts[:-1]
        
        return ' '.join(parts)


class MonthlyChapterReport(models.Model):
    """
    Monthly performance report for each chapter.
    Stores current month and last month data for comparison.
    """
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='monthly_reports')
    report_month = models.DateField(help_text="First day of the month (e.g., 2024-12-01)")
    
    # Performance Metrics
    total_referrals_given = models.IntegerField(default=0)
    total_referrals_received = models.IntegerField(default=0)
    total_one_to_ones = models.IntegerField(default=0)
    total_tyfcb = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Chapter Stats
    active_member_count = models.IntegerField(default=0)
    avg_referrals_per_member = models.FloatField(default=0)
    avg_one_to_ones_per_member = models.FloatField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['chapter', 'report_month']
        ordering = ['-report_month']
        
    def __str__(self):
        return f"{self.chapter.name} - {self.report_month.strftime('%B %Y')}"
    
    @property
    def performance_score(self):
        """Calculate overall performance score (0-100)"""
        if self.active_member_count == 0:
            return 0
        
        # Weight different metrics
        referral_score = min(self.avg_referrals_per_member * 10, 40)  # Max 40 points
        oto_score = min(self.avg_one_to_ones_per_member * 5, 30)     # Max 30 points  
        tyfcb_score = min(float(self.total_tyfcb) / 10000, 30)       # Max 30 points
        
        return round(referral_score + oto_score + tyfcb_score)
    
    def calculate_growth(self, previous_report):
        """Calculate growth metrics compared to previous month"""
        if not previous_report:
            return {}
            
        def safe_percentage_change(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100, 1)
        
        return {
            'referrals_growth': safe_percentage_change(
                self.total_referrals_given, previous_report.total_referrals_given
            ),
            'one_to_ones_growth': safe_percentage_change(
                self.total_one_to_ones, previous_report.total_one_to_ones
            ),
            'tyfcb_growth': safe_percentage_change(
                float(self.total_tyfcb), float(previous_report.total_tyfcb)
            ),
            'member_count_change': self.active_member_count - previous_report.active_member_count,
            'performance_score_change': self.performance_score - previous_report.performance_score
        }


class MemberMonthlyMetrics(models.Model):
    """
    Monthly performance metrics for individual members.
    Tracks member performance month over month.
    """
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='monthly_metrics')
    chapter_report = models.ForeignKey(MonthlyChapterReport, on_delete=models.CASCADE, related_name='member_metrics')
    report_month = models.DateField()
    
    # Individual Performance
    referrals_given = models.IntegerField(default=0)
    referrals_received = models.IntegerField(default=0)
    one_to_ones_completed = models.IntegerField(default=0)
    tyfcb_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Performance Analysis
    performance_score = models.FloatField(default=0)
    
    # One-to-One Analysis
    total_possible_otos = models.IntegerField(default=0, help_text="Based on chapter member count")
    oto_completion_rate = models.FloatField(default=0, help_text="Percentage of possible OTOs completed")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['member', 'report_month']
        ordering = ['-report_month', 'member__first_name']
        
    def __str__(self):
        return f"{self.member.full_name} - {self.report_month.strftime('%B %Y')}"
    
    def calculate_performance_score(self):
        """Calculate individual performance score (0-100)"""
        # Similar to chapter calculation but individual metrics
        referral_score = min(self.referrals_given * 2, 40)  # Max 40 points
        received_score = min(self.referrals_received * 2, 30)  # Max 30 points
        oto_score = min(self.oto_completion_rate, 30)  # Max 30 points (based on completion rate)
        
        return round(referral_score + received_score + oto_score)
    
    def calculate_growth(self, previous_metrics):
        """Calculate growth metrics compared to previous month"""
        if not previous_metrics:
            return {}
            
        def safe_percentage_change(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100, 1)
        
        return {
            'referrals_given_growth': safe_percentage_change(
                self.referrals_given, previous_metrics.referrals_given
            ),
            'referrals_received_growth': safe_percentage_change(
                self.referrals_received, previous_metrics.referrals_received
            ),
            'one_to_ones_growth': safe_percentage_change(
                self.one_to_ones_completed, previous_metrics.one_to_ones_completed
            ),
            'tyfcb_growth': safe_percentage_change(
                float(self.tyfcb_amount), float(previous_metrics.tyfcb_amount)
            ),
            'performance_score_change': self.performance_score - previous_metrics.performance_score
        }
    
    def save(self, *args, **kwargs):
        # Auto-calculate performance score on save
        if not self.performance_score:
            self.performance_score = self.calculate_performance_score()
        super().save(*args, **kwargs)


