"""
File Upload ViewSet - RESTful API for Excel file uploads
"""
import logging
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from chapters.models import Chapter
from bni.services.excel_processor import ExcelProcessorService
from bni.services.bulk_upload_service import BulkUploadService

logger = logging.getLogger(__name__)


class FileUploadSerializer(serializers.Serializer):
    """Serializer for file upload validation."""
    slip_audit_file = serializers.FileField()
    member_names_file = serializers.FileField(required=False)
    chapter_id = serializers.IntegerField()
    month_year = serializers.CharField(max_length=7, help_text="e.g., '2024-06'")
    upload_option = serializers.ChoiceField(choices=['slip_only', 'slip_and_members'], default='slip_only')


class FileUploadViewSet(viewsets.ViewSet):
    """
    ViewSet for file upload operations.

    Provides endpoints for:
    - Excel file upload: Process slip audit and member names files
    - Bulk upload: Process Regional PALMS Summary reports
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]  # TODO: Add proper authentication

    @action(detail=False, methods=['post'], url_path='excel')
    def upload_excel(self, request):
        """
        Handle Excel file upload and processing.

        Accepts:
        - slip_audit_file: Required Excel file (.xls/.xlsx)
        - member_names_file: Optional Excel file for member names
        - chapter_id: Chapter to associate with
        - month_year: Report month in format 'YYYY-MM'
        - upload_option: 'slip_only' or 'slip_and_members'

        Returns processing result with created records and any errors.
        """
        serializer = FileUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get validated data
            slip_audit_file = serializer.validated_data['slip_audit_file']
            member_names_file = serializer.validated_data.get('member_names_file')
            chapter_id = serializer.validated_data['chapter_id']
            month_year = serializer.validated_data['month_year']
            upload_option = serializer.validated_data['upload_option']

            # Validate chapter access
            try:
                chapter = Chapter.objects.get(id=chapter_id)
                # Add permission check here if needed
            except Chapter.DoesNotExist:
                return Response(
                    {'error': 'Chapter not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Validate file types
            if not slip_audit_file.name.lower().endswith(('.xls', '.xlsx')):
                return Response(
                    {'error': 'Only .xls and .xlsx files are supported for slip audit file'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if member_names_file and not member_names_file.name.lower().endswith(('.xls', '.xlsx')):
                return Response(
                    {'error': 'Only .xls and .xlsx files are supported for member names file'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process using the new monthly report method
            processor = ExcelProcessorService(chapter)
            result = processor.process_monthly_report(
                slip_audit_file=slip_audit_file,
                member_names_file=member_names_file,
                month_year=month_year
            )

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Processing failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_upload(self, request):
        """
        Handle Regional PALMS Summary bulk upload.

        Accepts:
        - file: Excel file containing regional summary data

        Processes the file and creates/updates multiple chapters and members.
        Returns summary of operations performed.
        """
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']

        # Validate file type
        if not file.name.endswith(('.xls', '.xlsx')):
            return Response(
                {'error': 'Invalid file type. Please upload .xls or .xlsx file'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Process the file
            service = BulkUploadService()
            result = service.process_region_summary(file)

            if result['success']:
                return Response({
                    'success': True,
                    'message': 'Bulk upload completed successfully',
                    'details': {
                        'chapters_created': result['chapters_created'],
                        'chapters_updated': result['chapters_updated'],
                        'members_created': result['members_created'],
                        'members_updated': result['members_updated'],
                        'total_processed': result['total_processed'],
                        'warnings': result['warnings']
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': result.get('error', 'Processing failed'),
                    'details': {
                        'errors': result.get('errors', []),
                        'warnings': result.get('warnings', [])
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("Error in bulk upload")
            return Response(
                {'error': f'Processing failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
