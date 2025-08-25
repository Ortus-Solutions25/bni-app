#!/usr/bin/env python
"""
Script to export August 2024 BNI data as JSON files for frontend consumption.
Generates matrix data files that can be used by the React frontend.
"""

import os
import sys
import json
from datetime import date
from collections import defaultdict, Counter

# Add Django project path
sys.path.append('/Users/nat/dev/freelance/pankaj_gupta/bni-app/backend')

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from chapters.models import Chapter, Member, MonthlyChapterReport, MemberMonthlyMetrics


def generate_chapter_data():
    """Generate data for all chapters with August 2024 reports."""
    
    # Get all chapters that have August 2024 reports
    august_2024 = date(2024, 8, 1)
    chapters_with_reports = Chapter.objects.filter(
        monthly_reports__report_month=august_2024
    ).distinct()
    
    all_chapter_data = []
    
    for chapter in chapters_with_reports:
        print(f"Processing chapter: {chapter.name}")
        
        # Get the August report for this chapter
        try:
            report = MonthlyChapterReport.objects.get(
                chapter=chapter,
                report_month=august_2024
            )
        except MonthlyChapterReport.DoesNotExist:
            print(f"No August report found for {chapter.name}")
            continue
        
        # Get all members for this chapter
        members = Member.objects.filter(chapter=chapter, is_active=True)
        member_names = [f"{member.first_name} {member.last_name}" for member in members]
        
        # Initialize matrices
        member_count = len(member_names)
        referral_matrix = [[0 for _ in range(member_count)] for _ in range(member_count)]
        one_to_one_matrix = [[0 for _ in range(member_count)] for _ in range(member_count)]
        
        # Process the raw data from the report to build matrices
        # For now, we'll create sample data since the audit reports contain slip data
        # but we haven't implemented the matrix calculation yet
        
        # TYFCB summary (placeholder data)
        tyfcb_summary = {
            'withinChapter': [
                {'member': name, 'amount': 1000 + (i * 100), 'count': 5 + i} 
                for i, name in enumerate(member_names[:5])
            ],
            'outsideChapter': [
                {'member': name, 'amount': 500 + (i * 50), 'count': 2 + i} 
                for i, name in enumerate(member_names[:3])
            ],
            'totalWithinChapter': sum(1000 + (i * 100) for i in range(5)),
            'totalOutsideChapter': sum(500 + (i * 50) for i in range(3))
        }
        
        # Create chapter data structure
        chapter_data = {
            'chapterId': str(chapter.id),
            'chapterName': chapter.name,
            'reportMonth': august_2024.isoformat(),
            'members': member_names,
            'memberCount': member_count,
            'referralMatrix': referral_matrix,
            'oneToOneMatrix': one_to_one_matrix,
            'combinationMatrix': referral_matrix,  # Same as referral for now
            'tyfcbSummary': tyfcb_summary,
            'statistics': {
                'totalReferrals': report.total_referrals_given or 0,
                'totalOneToOnes': report.total_one_to_ones or 0,
                'totalTYFCB': float(report.total_tyfcb or 0),
                'activeMemberCount': report.active_member_count or 0
            }
        }
        
        all_chapter_data.append(chapter_data)
        print(f"Generated data for {chapter.name}: {member_count} members")
    
    return all_chapter_data


def save_chapter_data(chapter_data_list, output_dir):
    """Save chapter data as JSON files."""
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save individual chapter files
    for chapter_data in chapter_data_list:
        chapter_name = chapter_data['chapterName'].replace(' ', '_').replace('BNI_', '').lower()
        filename = f"{chapter_name}_august_2024.json"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(chapter_data, f, indent=2)
        
        print(f"Saved: {filepath}")
    
    # Save combined file with all chapters
    combined_filepath = os.path.join(output_dir, 'all_chapters_august_2024.json')
    with open(combined_filepath, 'w') as f:
        json.dump(chapter_data_list, f, indent=2)
    
    print(f"Saved combined file: {combined_filepath}")
    
    # Create summary file
    summary = {
        'reportMonth': '2024-08-01',
        'totalChapters': len(chapter_data_list),
        'chapters': [
            {
                'chapterId': chapter['chapterId'],
                'chapterName': chapter['chapterName'],
                'memberCount': chapter['memberCount'],
                'totalReferrals': chapter['statistics']['totalReferrals'],
                'totalOneToOnes': chapter['statistics']['totalOneToOnes']
            }
            for chapter in chapter_data_list
        ]
    }
    
    summary_filepath = os.path.join(output_dir, 'august_2024_summary.json')
    with open(summary_filepath, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"Saved summary file: {summary_filepath}")


if __name__ == '__main__':
    output_directory = '/Users/nat/dev/freelance/pankaj_gupta/bni-app/frontend/public/needed-data/august-matrices'
    
    print("Generating August 2024 chapter data...")
    chapter_data = generate_chapter_data()
    
    print(f"\nGenerated data for {len(chapter_data)} chapters")
    
    print(f"\nSaving files to: {output_directory}")
    save_chapter_data(chapter_data, output_directory)
    
    print("\n✅ Export completed successfully!")
    print(f"Generated {len(chapter_data)} chapter files + summary files")