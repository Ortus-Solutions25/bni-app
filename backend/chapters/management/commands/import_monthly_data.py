from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_date
from datetime import date
import os
from data_processing.services import BNIMonthlyDataImportService


class Command(BaseCommand):
    help = 'Import BNI monthly audit report data from Excel files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--chapter',
            type=str,
            required=True,
            help='Name of the BNI chapter (e.g., "BNI Continental")'
        )
        parser.add_argument(
            '--file',
            type=str,
            required=True,
            help='Path to the Excel audit report file'
        )
        parser.add_argument(
            '--month',
            type=str,
            required=True,
            help='Report month in YYYY-MM-DD format (e.g., "2024-12-01")'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose output'
        )

    def handle(self, *args, **options):
        chapter_name = options['chapter']
        excel_file_path = options['file']
        month_str = options['month']
        verbose = options['verbose']

        # Validate file exists
        if not os.path.exists(excel_file_path):
            raise CommandError(f'Excel file not found: {excel_file_path}')

        # Parse and validate date
        report_month = parse_date(month_str)
        if not report_month:
            raise CommandError(f'Invalid date format: {month_str}. Use YYYY-MM-DD format.')

        # Ensure it's the first day of the month
        report_month = report_month.replace(day=1)

        if verbose:
            self.stdout.write(f'Importing data for {chapter_name}')
            self.stdout.write(f'File: {excel_file_path}')
            self.stdout.write(f'Report month: {report_month}')

        # Import the data
        import_service = BNIMonthlyDataImportService()
        
        try:
            result = import_service.import_monthly_data(
                chapter_name=chapter_name,
                excel_file_path=excel_file_path,
                report_month=report_month
            )

            # Display results
            stats = result['stats']
            errors = result['errors']

            self.stdout.write(
                self.style.SUCCESS(f'\n✅ Import completed for {chapter_name}')
            )
            
            self.stdout.write(f'📊 Import Statistics:')
            self.stdout.write(f'  - Chapters created: {stats["chapters_created"]}')
            self.stdout.write(f'  - Members created: {stats["members_created"]}')
            self.stdout.write(f'  - Chapter reports created: {stats["reports_created"]}')
            self.stdout.write(f'  - Member metrics created: {stats["metrics_created"]}')

            if stats['errors'] > 0:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  {stats["errors"]} errors occurred')
                )

            if errors:
                self.stdout.write(self.style.ERROR('\n❌ Errors:'))
                for error in errors:
                    self.stdout.write(f'  - {error}')

            if stats['errors'] == 0:
                self.stdout.write(
                    self.style.SUCCESS(f'\n🎉 Successfully imported data for {chapter_name}!')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'\n⚠️  Import completed with {stats["errors"]} errors')
                )

        except Exception as e:
            raise CommandError(f'Import failed: {str(e)}')