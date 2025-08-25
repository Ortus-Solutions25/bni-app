from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_date
from datetime import date
import os
import glob
from data_processing.services import BNIMonthlyDataImportService


class Command(BaseCommand):
    help = 'Import BNI monthly data for all chapters from a directory of Excel files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--directory',
            type=str,
            required=True,
            help='Directory containing Excel files for all chapters'
        )
        parser.add_argument(
            '--month',
            type=str,
            required=True,
            help='Report month in YYYY-MM-DD format (e.g., "2024-12-01")'
        )
        parser.add_argument(
            '--pattern',
            type=str,
            default='*.xls*',
            help='File pattern to match (default: "*.xls*")'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose output'
        )

    def handle(self, *args, **options):
        directory = options['directory']
        month_str = options['month']
        pattern = options['pattern']
        verbose = options['verbose']

        # Validate directory exists
        if not os.path.isdir(directory):
            raise CommandError(f'Directory not found: {directory}')

        # Parse and validate date
        report_month = parse_date(month_str)
        if not report_month:
            raise CommandError(f'Invalid date format: {month_str}. Use YYYY-MM-DD format.')

        # Ensure it's the first day of the month
        report_month = report_month.replace(day=1)

        # Find all Excel files in directory
        search_pattern = os.path.join(directory, pattern)
        excel_files = glob.glob(search_pattern)

        if not excel_files:
            raise CommandError(f'No Excel files found matching pattern: {search_pattern}')

        if verbose:
            self.stdout.write(f'Found {len(excel_files)} Excel files to import')
            self.stdout.write(f'Report month: {report_month}')

        # Chapter name mapping based on filename patterns
        # You can customize this based on your file naming convention
        chapter_name_mapping = {
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

        import_service = BNIMonthlyDataImportService()
        total_stats = {
            'chapters_created': 0,
            'members_created': 0,
            'reports_created': 0,
            'metrics_created': 0,
            'errors': 0
        }
        all_errors = []

        # Process each file
        for excel_file in excel_files:
            filename = os.path.basename(excel_file).lower()
            
            # Try to determine chapter name from filename
            chapter_name = None
            for key, name in chapter_name_mapping.items():
                if key in filename:
                    chapter_name = name
                    break
            
            if not chapter_name:
                # Extract chapter name from filename (fallback)
                base_name = os.path.splitext(os.path.basename(excel_file))[0]
                chapter_name = f"BNI {base_name.title()}"

            if verbose:
                self.stdout.write(f'\n📁 Processing: {excel_file}')
                self.stdout.write(f'🏢 Chapter: {chapter_name}')

            try:
                result = import_service.import_monthly_data(
                    chapter_name=chapter_name,
                    excel_file_path=excel_file,
                    report_month=report_month
                )

                # Accumulate statistics
                stats = result['stats']
                for key in total_stats:
                    total_stats[key] += stats[key]

                # Collect errors
                if result['errors']:
                    all_errors.extend([f"{chapter_name}: {error}" for error in result['errors']])

                if verbose:
                    if stats['errors'] == 0:
                        self.stdout.write(
                            self.style.SUCCESS(f'✅ {chapter_name}: Success')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'⚠️  {chapter_name}: {stats["errors"]} errors')
                        )

            except Exception as e:
                error_msg = f"{chapter_name}: {str(e)}"
                all_errors.append(error_msg)
                total_stats['errors'] += 1
                
                if verbose:
                    self.stdout.write(
                        self.style.ERROR(f'❌ {chapter_name}: {str(e)}')
                    )

        # Display final results
        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Bulk import completed!')
        )
        
        self.stdout.write(f'\n📊 Total Statistics:')
        self.stdout.write(f'  - Files processed: {len(excel_files)}')
        self.stdout.write(f'  - Chapters created: {total_stats["chapters_created"]}')
        self.stdout.write(f'  - Members created: {total_stats["members_created"]}')
        self.stdout.write(f'  - Chapter reports created: {total_stats["reports_created"]}')
        self.stdout.write(f'  - Member metrics created: {total_stats["metrics_created"]}')
        self.stdout.write(f'  - Total errors: {total_stats["errors"]}')

        if all_errors:
            self.stdout.write(self.style.ERROR(f'\n❌ Errors ({len(all_errors)} total):'))
            for error in all_errors:
                self.stdout.write(f'  - {error}')

        if total_stats['errors'] == 0:
            self.stdout.write(
                self.style.SUCCESS(f'\n✨ All imports completed successfully!')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'\n⚠️  Import completed with {total_stats["errors"]} errors')
            )