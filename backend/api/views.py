from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from datetime import datetime, date
import tempfile
import os
from pathlib import Path

from chapters.models import Chapter, Member
from analytics.models import Referral, OneToOne, TYFCB, DataImportSession
from data_processing.services import ExcelProcessorService
from data_processing.utils import MatrixGenerator, DataValidator


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    chapter_id = serializers.IntegerField()
    week_of = serializers.DateField(required=False)


class ExcelUploadView(APIView):
    """Handle Excel file upload and processing."""
    
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get validated data
            file = serializer.validated_data['file']
            chapter_id = serializer.validated_data['chapter_id']
            week_of = serializer.validated_data.get('week_of')
            
            # Validate chapter access
            try:
                chapter = Chapter.objects.get(id=chapter_id)
                # Add permission check here if needed
            except Chapter.DoesNotExist:
                return Response(
                    {'error': 'Chapter not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Validate file type
            if not file.name.lower().endswith(('.xls', '.xlsx')):
                return Response(
                    {'error': 'Only .xls and .xlsx files are supported'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save file to temporary location
            with tempfile.NamedTemporaryFile(
                delete=False, 
                suffix=Path(file.name).suffix
            ) as tmp_file:
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                tmp_file_path = tmp_file.name
            
            try:
                # Process the Excel file
                processor = ExcelProcessorService(chapter)
                result = processor.process_excel_file(tmp_file_path, week_of)
                
                return Response(result, status=status.HTTP_200_OK)
                
            finally:
                # Clean up temporary file
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
        
        except Exception as e:
            return Response(
                {'error': f'Processing failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_referral_matrix(request, chapter_id):
    """Generate and return referral matrix for a chapter."""
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        members = list(Member.objects.filter(chapter=chapter, is_active=True))
        referrals = list(Referral.objects.filter(giver__chapter=chapter))
        
        generator = MatrixGenerator(members)
        matrix = generator.generate_referral_matrix(referrals)
        
        # Convert to JSON-serializable format
        result = {
            'members': [m.full_name for m in members],
            'matrix': matrix.values.tolist(),
            'totals': {
                'given': matrix.sum(axis=1).to_dict(),
                'received': matrix.sum(axis=0).to_dict()
            }
        }
        
        return Response(result)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Matrix generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_one_to_one_matrix(request, chapter_id):
    """Generate and return one-to-one matrix for a chapter."""
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        members = list(Member.objects.filter(chapter=chapter, is_active=True))
        one_to_ones = list(OneToOne.objects.filter(member1__chapter=chapter))
        
        generator = MatrixGenerator(members)
        matrix = generator.generate_one_to_one_matrix(one_to_ones)
        
        result = {
            'members': [m.full_name for m in members],
            'matrix': matrix.values.tolist(),
            'totals': matrix.sum(axis=1).to_dict()
        }
        
        return Response(result)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Matrix generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_combination_matrix(request, chapter_id):
    """Generate and return combination matrix for a chapter."""
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        members = list(Member.objects.filter(chapter=chapter, is_active=True))
        referrals = list(Referral.objects.filter(giver__chapter=chapter))
        one_to_ones = list(OneToOne.objects.filter(member1__chapter=chapter))
        
        generator = MatrixGenerator(members)
        matrix = generator.generate_combination_matrix(referrals, one_to_ones)
        
        result = {
            'members': [m.full_name for m in members],
            'matrix': matrix.values.tolist(),
            'legend': {
                '0': 'Neither',
                '1': 'One-to-One Only',
                '2': 'Referral Only',
                '3': 'Both'
            }
        }
        
        return Response(result)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Matrix generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_member_summary(request, chapter_id):
    """Get comprehensive member summary for a chapter."""
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        members = list(Member.objects.filter(chapter=chapter, is_active=True))
        referrals = list(Referral.objects.filter(giver__chapter=chapter))
        one_to_ones = list(OneToOne.objects.filter(member1__chapter=chapter))
        tyfcbs = list(TYFCB.objects.filter(receiver__chapter=chapter))
        
        generator = MatrixGenerator(members)
        summary = generator.generate_member_summary(referrals, one_to_ones, tyfcbs)
        
        # Convert DataFrame to list of dictionaries
        result = summary.to_dict('records')
        
        return Response(result)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Summary generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tyfcb_summary(request, chapter_id):
    """Get TYFCB summary for a chapter."""
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        members = list(Member.objects.filter(chapter=chapter, is_active=True))
        tyfcbs = list(TYFCB.objects.filter(receiver__chapter=chapter))
        
        generator = MatrixGenerator(members)
        summary = generator.generate_tyfcb_summary(tyfcbs)
        
        result = summary.to_dict('records')
        
        return Response(result)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'TYFCB summary failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_data_quality_report(request, chapter_id):
    """Get data quality report for a chapter."""
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        referrals = list(Referral.objects.filter(giver__chapter=chapter))
        one_to_ones = list(OneToOne.objects.filter(member1__chapter=chapter))
        tyfcbs = list(TYFCB.objects.filter(receiver__chapter=chapter))
        
        report = DataValidator.generate_quality_report(
            referrals, one_to_ones, tyfcbs
        )
        
        return Response(report)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Quality report failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_import_history(request, chapter_id):
    """Get import history for a chapter."""
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        sessions = DataImportSession.objects.filter(chapter=chapter)[:50]
        
        result = []
        for session in sessions:
            result.append({
                'id': session.id,
                'file_name': session.file_name,
                'import_date': session.import_date,
                'success': session.success,
                'records_processed': session.records_processed,
                'referrals_created': session.referrals_created,
                'one_to_ones_created': session.one_to_ones_created,
                'tyfcbs_created': session.tyfcbs_created,
                'errors_count': session.errors_count,
            })
        
        return Response(result)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Import history failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========================================
# CHAPTER-FOCUSED API ENDPOINTS
# ========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def chapter_dashboard(request):
    """Get dashboard data for all chapters."""
    try:
        from chapters.models import MonthlyChapterReport
        
        chapters = Chapter.objects.all().order_by('name')
        dashboard_data = []
        
        for chapter in chapters:
            # Get member count
            member_count = chapter.members.filter(is_active=True).count()
            
            # Get latest monthly report (August 2024)
            latest_report = chapter.monthly_reports.order_by('-report_month').first()
            
            # Build chapter data
            chapter_data = {
                'id': chapter.id,
                'name': chapter.name,
                'location': chapter.location or 'Dubai',
                'latest_data_date': latest_report.report_month.isoformat() if latest_report else None,
                'member_count': member_count,
                'total_referrals': latest_report.total_referrals_given if latest_report else 0,
                'total_tyfcb': float(latest_report.total_tyfcb) if latest_report else 0.0,
                'performance_score': latest_report.performance_score if latest_report else 0,
                'avg_referrals_per_member': latest_report.avg_referrals_per_member if latest_report else 0,
                'avg_otos_per_member': latest_report.avg_one_to_ones_per_member if latest_report else 0,
                'has_data': member_count > 0
            }
            dashboard_data.append(chapter_data)
        
        return Response({
            'chapters': dashboard_data,
            'total_chapters': len(dashboard_data),
            'total_members': sum(c['member_count'] for c in dashboard_data)
        })
        
    except Exception as e:
        return Response(
            {'error': f'Dashboard failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def chapter_detail(request, chapter_id):
    """Get detailed information for a specific chapter."""
    try:
        from chapters.models import MonthlyChapterReport, MemberMonthlyMetrics
        
        chapter = Chapter.objects.get(id=chapter_id)
        
        # Get member details
        members = list(chapter.members.filter(is_active=True).order_by('first_name', 'last_name'))
        member_count = len(members)
        
        # Get latest monthly report (August 2024)
        latest_report = chapter.monthly_reports.order_by('-report_month').first()
        
        # Get member monthly metrics for detailed breakdown
        member_metrics = []
        if latest_report:
            metrics_queryset = MemberMonthlyMetrics.objects.filter(
                chapter_report=latest_report
            ).select_related('member')
            
            for metrics in metrics_queryset:
                member_metrics.append({
                    'name': metrics.member.full_name,
                    'referrals_given': metrics.referrals_given,
                    'referrals_received': metrics.referrals_received,
                    'one_to_ones': metrics.one_to_ones_completed,
                    'tyfcb': float(metrics.tyfcb_amount),
                    'performance_score': metrics.performance_score,
                    'oto_completion_rate': metrics.oto_completion_rate
                })
        
        # Find top performer
        top_performer = 'N/A'
        if member_metrics:
            top_performer = max(member_metrics, key=lambda x: x['referrals_given'])['name']
        
        chapter_data = {
            'id': chapter.id,
            'name': chapter.name,
            'location': chapter.location or 'Dubai',
            'latest_data_date': latest_report.report_month.isoformat() if latest_report else None,
            'member_count': member_count,
            'members': [member.full_name for member in members],
            'total_referrals': latest_report.total_referrals_given if latest_report else 0,
            'total_otos': latest_report.total_one_to_ones if latest_report else 0,
            'total_tyfcb': float(latest_report.total_tyfcb) if latest_report else 0.0,
            'performance_score': latest_report.performance_score if latest_report else 0,
            'avg_referrals_per_member': latest_report.avg_referrals_per_member if latest_report else 0,
            'avg_otos_per_member': latest_report.avg_one_to_ones_per_member if latest_report else 0,
            'top_performer': top_performer,
            'member_metrics': member_metrics,
            'has_data': member_count > 0 and latest_report is not None
        }
        
        return Response(chapter_data)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Chapter detail failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
