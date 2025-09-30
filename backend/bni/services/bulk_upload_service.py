"""
Bulk Upload Service for Regional PALMS Summary Reports

This service processes Regional PALMS Summary reports that contain
multiple chapters and their members. It automatically creates or updates
chapters and members found in the report.
"""
import logging
from typing import Dict, Any
from django.db import transaction
from bni.models import Chapter, Member
from bni.services.excel_processor import ExcelProcessorService

logger = logging.getLogger(__name__)


class BulkUploadService:
    """Service for processing Regional PALMS Summary reports."""

    def __init__(self):
        self.errors = []
        self.warnings = []
        self.chapters_created = 0
        self.chapters_updated = 0
        self.members_created = 0
        self.members_updated = 0

    def process_region_summary(self, file) -> Dict[str, Any]:
        """
        Process a Regional PALMS Summary report.

        Args:
            file: Uploaded file object (InMemoryUploadedFile or TemporaryUploadedFile)

        Returns:
            Dictionary with processing results
        """
        try:
            # Read the Excel file using existing XML parser
            processor = ExcelProcessorService(None)

            # Handle different file types
            if hasattr(file, 'temporary_file_path'):
                # TemporaryUploadedFile
                from pathlib import Path
                df = processor._parse_xml_excel(file.temporary_file_path())
            else:
                # InMemoryUploadedFile - save temporarily
                import tempfile
                import os

                with tempfile.NamedTemporaryFile(delete=False, suffix='.xls') as temp_file:
                    for chunk in file.chunks():
                        temp_file.write(chunk)
                    temp_file.flush()

                    try:
                        df = processor._parse_xml_excel(temp_file.name)
                    finally:
                        os.unlink(temp_file.name)

            # Validate required columns
            required_columns = ['Chapter', 'First Name', 'Last Name']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing_columns)}',
                    'chapters_created': 0,
                    'chapters_updated': 0,
                    'members_created': 0,
                    'members_updated': 0,
                    'errors': [f'Missing columns: {missing_columns}'],
                    'warnings': []
                }

            # Process all rows
            with transaction.atomic():
                for idx, row in df.iterrows():
                    try:
                        self._process_row(row)
                    except Exception as e:
                        error_msg = f"Row {idx + 1}: {str(e)}"
                        logger.error(error_msg)
                        self.errors.append(error_msg)

            return {
                'success': len(self.errors) == 0,
                'chapters_created': self.chapters_created,
                'chapters_updated': self.chapters_updated,
                'members_created': self.members_created,
                'members_updated': self.members_updated,
                'total_processed': len(df),
                'errors': self.errors,
                'warnings': self.warnings,
            }

        except Exception as e:
            logger.exception("Error processing region summary")
            return {
                'success': False,
                'error': f'Processing failed: {str(e)}',
                'chapters_created': 0,
                'chapters_updated': 0,
                'members_created': 0,
                'members_updated': 0,
                'errors': [str(e)],
                'warnings': []
            }

    def _process_row(self, row) -> None:
        """Process a single row from the region summary."""
        import pandas as pd

        # Extract chapter name
        chapter_name = str(row['Chapter']).strip() if pd.notna(row['Chapter']) else None
        if not chapter_name:
            self.warnings.append(f"Skipping row with missing chapter name")
            return

        # Get or create chapter (reusing existing model methods)
        chapter, created = Chapter.objects.get_or_create(
            name=chapter_name,
            defaults={
                'location': 'Dubai',  # Default location
                'meeting_day': '',
                'meeting_time': None,
            }
        )

        if created:
            self.chapters_created += 1
            logger.info(f"Created chapter: {chapter_name}")
        else:
            self.chapters_updated += 1

        # Extract member info
        first_name = str(row['First Name']).strip() if pd.notna(row['First Name']) else None
        last_name = str(row['Last Name']).strip() if pd.notna(row['Last Name']) else None

        if not first_name or not last_name:
            self.warnings.append(f"Skipping member with missing name in {chapter_name}")
            return

        # Normalize the name for matching
        normalized_name = Member.normalize_name(f"{first_name} {last_name}")

        # Get or create member (reusing existing model methods)
        member, created = Member.objects.get_or_create(
            chapter=chapter,
            normalized_name=normalized_name,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'business_name': '',
                'classification': '',
                'is_active': True,
            }
        )

        if created:
            self.members_created += 1
            logger.info(f"Created member: {first_name} {last_name} in {chapter_name}")
        else:
            # Update existing member if needed
            updated = False
            if member.first_name != first_name:
                member.first_name = first_name
                updated = True
            if member.last_name != last_name:
                member.last_name = last_name
                updated = True

            if updated:
                member.save()
                self.members_updated += 1
            else:
                # Count as updated even if no changes (to track processing)
                self.members_updated += 1
