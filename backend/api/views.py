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
    slip_audit_file = serializers.FileField()
    member_names_file = serializers.FileField(required=False)
    chapter_id = serializers.IntegerField()
    month_year = serializers.CharField(max_length=7, help_text="e.g., '2024-06'")
    upload_option = serializers.ChoiceField(choices=['slip_only', 'slip_and_members'], default='slip_only')


class ExcelUploadView(APIView):
    """Handle Excel file upload and processing."""
    
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]
    
    def post(self, request):
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


@api_view(['GET'])
@permission_classes([AllowAny])
def get_referral_matrix(request, chapter_id, report_id):
    """Return referral matrix for a specific monthly report."""
    try:
        from chapters.models import MonthlyReport
        
        chapter = Chapter.objects.get(id=chapter_id)
        monthly_report = MonthlyReport.objects.get(id=report_id, chapter=chapter)
        
        # Return the pre-processed matrix data
        result = monthly_report.referral_matrix_data
        
        return Response(result)
        
    except (Chapter.DoesNotExist, MonthlyReport.DoesNotExist):
        return Response(
            {'error': 'Chapter or monthly report not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Matrix generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_one_to_one_matrix(request, chapter_id, report_id):
    """Return one-to-one matrix for a specific monthly report."""
    try:
        from chapters.models import MonthlyReport
        
        chapter = Chapter.objects.get(id=chapter_id)
        monthly_report = MonthlyReport.objects.get(id=report_id, chapter=chapter)
        
        # Return the pre-processed matrix data
        result = monthly_report.oto_matrix_data
        
        return Response(result)
        
    except (Chapter.DoesNotExist, MonthlyReport.DoesNotExist):
        return Response(
            {'error': 'Chapter or monthly report not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Matrix generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_combination_matrix(request, chapter_id, report_id):
    """Return combination matrix for a specific monthly report."""
    try:
        from chapters.models import MonthlyReport
        
        chapter = Chapter.objects.get(id=chapter_id)
        monthly_report = MonthlyReport.objects.get(id=report_id, chapter=chapter)
        
        # Return the pre-processed matrix data
        result = monthly_report.combination_matrix_data
        
        return Response(result)
        
    except (Chapter.DoesNotExist, MonthlyReport.DoesNotExist):
        return Response(
            {'error': 'Chapter or monthly report not found'},
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
        from analytics.models import Referral, OneToOne, TYFCB
        from chapters.models import MonthlyReport
        from django.db.models import Count, Sum
        
        chapters = Chapter.objects.all().order_by('name')
        dashboard_data = []
        
        for chapter in chapters:
            # Get actual data from database
            members = Member.objects.filter(chapter=chapter, is_active=True)
            referrals = Referral.objects.filter(giver__chapter=chapter)
            tyfcbs = TYFCB.objects.filter(receiver__chapter=chapter)
            monthly_reports = MonthlyReport.objects.filter(chapter=chapter).order_by('-month_year')
            
            # Get latest data date from monthly report
            latest_date = None
            if monthly_reports.exists():
                latest_report = monthly_reports.first()
                latest_date = f"{latest_report.month_year}"
            
            # Calculate total TYFCB amount
            total_tyfcb = tyfcbs.aggregate(total=Sum('amount'))['total'] or 0.0
            
            # Calculate averages
            member_count = members.count()
            referral_count = referrals.count()
            one_to_ones = OneToOne.objects.filter(member1__chapter=chapter)
            oto_count = one_to_ones.count()
            
            avg_referrals = round(referral_count / member_count, 2) if member_count > 0 else 0
            avg_tyfcb = round(float(total_tyfcb) / member_count, 2) if member_count > 0 else 0
            avg_otos = round(oto_count / member_count, 2) if member_count > 0 else 0
            
            chapter_data = {
                'id': chapter.id,
                'name': chapter.name,
                'location': chapter.location if hasattr(chapter, 'location') else 'Dubai',
                'latest_data_date': latest_date,
                'member_count': member_count,
                'total_referrals': referral_count,
                'total_one_to_ones': oto_count,
                'total_tyfcb': float(total_tyfcb),
                'avg_referrals_per_member': avg_referrals,
                'avg_tyfcb_per_member': avg_tyfcb,
                'avg_otos_per_member': avg_otos,
                'has_data': monthly_reports.exists()
            }
            dashboard_data.append(chapter_data)
        
        return Response({
            'chapters': dashboard_data,
            'total_chapters': len(dashboard_data)
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
        from analytics.models import Referral, OneToOne, TYFCB
        from chapters.models import MonthlyReport
        from django.db.models import Sum
        
        chapter = Chapter.objects.get(id=chapter_id)
        members = Member.objects.filter(chapter=chapter, is_active=True)
        
        # Get actual data from database
        referrals = Referral.objects.filter(giver__chapter=chapter)
        one_to_ones = OneToOne.objects.filter(member1__chapter=chapter)
        tyfcbs = TYFCB.objects.filter(receiver__chapter=chapter)
        monthly_reports = MonthlyReport.objects.filter(chapter=chapter).order_by('-month_year')
        
        # Get latest data date
        latest_date = None
        if monthly_reports.exists():
            latest_report = monthly_reports.first()
            latest_date = f"{latest_report.month_year}"
        
        # Calculate totals
        member_count = members.count()
        referral_count = referrals.count()
        oto_count = one_to_ones.count()
        total_tyfcb = tyfcbs.aggregate(total=Sum('amount'))['total'] or 0.0
        
        # Calculate averages
        avg_referrals = round(referral_count / member_count, 2) if member_count > 0 else 0
        avg_tyfcb = round(float(total_tyfcb) / member_count, 2) if member_count > 0 else 0
        avg_otos = round(oto_count / member_count, 2) if member_count > 0 else 0
        
        chapter_data = {
            'id': chapter.id,
            'name': chapter.name,
            'location': chapter.location if hasattr(chapter, 'location') else 'Dubai',
            'latest_data_date': latest_date,
            'member_count': member_count,
            'total_referrals': referral_count,
            'total_one_to_ones': oto_count,
            'total_tyfcb': float(total_tyfcb),
            'avg_referrals_per_member': avg_referrals,
            'avg_tyfcb_per_member': avg_tyfcb,
            'avg_otos_per_member': avg_otos,
            'has_data': monthly_reports.exists(),
            'members': [
                {
                    'id': member.id,
                    'full_name': member.full_name,
                    'business_name': member.business_name,
                    'classification': member.classification,
                    'email': member.email,
                    'phone': member.phone
                }
                for member in members
            ]
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


@api_view(['GET'])
@permission_classes([AllowAny])
def get_monthly_reports(request, chapter_id):
    """Get all monthly reports for a specific chapter."""
    try:
        from chapters.models import MonthlyReport
        
        chapter = Chapter.objects.get(id=chapter_id)
        monthly_reports = MonthlyReport.objects.filter(chapter=chapter).order_by('-month_year')
        
        result = []
        for report in monthly_reports:
            result.append({
                'id': report.id,
                'month_year': report.month_year,
                'uploaded_at': report.uploaded_at,
                'processed_at': report.processed_at,
                'slip_audit_file': report.slip_audit_file.name if report.slip_audit_file else None,
                'member_names_file': report.member_names_file.name if report.member_names_file else None,
                'has_referral_matrix': bool(report.referral_matrix_data),
                'has_oto_matrix': bool(report.oto_matrix_data),
                'has_combination_matrix': bool(report.combination_matrix_data)
            })
        
        return Response(result)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Monthly reports retrieval failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_monthly_report(request, chapter_id, report_id):
    """Delete a monthly report."""
    try:
        from chapters.models import MonthlyReport
        
        chapter = Chapter.objects.get(id=chapter_id)
        monthly_report = MonthlyReport.objects.get(id=report_id, chapter=chapter)
        
        # Delete associated files
        if monthly_report.slip_audit_file:
            monthly_report.slip_audit_file.delete(save=False)
        if monthly_report.member_names_file:
            monthly_report.member_names_file.delete(save=False)
        
        # Delete the report
        monthly_report.delete()
        
        return Response({'message': 'Monthly report deleted successfully'})
        
    except (Chapter.DoesNotExist, MonthlyReport.DoesNotExist):
        return Response(
            {'error': 'Chapter or monthly report not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Monthly report deletion failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_member_detail(request, chapter_id, report_id, member_id):
    """Get detailed member information including missing interaction lists."""
    try:
        from chapters.models import MonthlyReport, MemberMonthlyStats
        
        chapter = Chapter.objects.get(id=chapter_id)
        monthly_report = MonthlyReport.objects.get(id=report_id, chapter=chapter)
        member = Member.objects.get(id=member_id, chapter=chapter)
        
        try:
            member_stats = MemberMonthlyStats.objects.get(
                member=member,
                monthly_report=monthly_report
            )
        except MemberMonthlyStats.DoesNotExist:
            # If no stats exist, return basic member info with empty lists
            member_stats = None
        
        # Get all chapter members for name resolution
        chapter_members = Member.objects.filter(chapter=chapter, is_active=True)
        member_lookup = {m.id: m.full_name for m in chapter_members}
        
        result = {
            'member': {
                'id': member.id,
                'full_name': member.full_name,
                'first_name': member.first_name,
                'last_name': member.last_name,
                'business_name': member.business_name,
                'classification': member.classification,
                'email': member.email,
                'phone': member.phone
            },
            'stats': {
                'referrals_given': member_stats.referrals_given if member_stats else 0,
                'referrals_received': member_stats.referrals_received if member_stats else 0,
                'one_to_ones_completed': member_stats.one_to_ones_completed if member_stats else 0,
                'tyfcb_inside_amount': float(member_stats.tyfcb_inside_amount) if member_stats else 0.0,
                'tyfcb_outside_amount': float(member_stats.tyfcb_outside_amount) if member_stats else 0.0
            },
            'missing_interactions': {
                'missing_otos': [
                    {
                        'id': member_id,
                        'name': member_lookup.get(member_id, 'Unknown')
                    }
                    for member_id in (member_stats.missing_otos if member_stats else [])
                    if member_id in member_lookup
                ],
                'missing_referrals_given_to': [
                    {
                        'id': member_id,
                        'name': member_lookup.get(member_id, 'Unknown')
                    }
                    for member_id in (member_stats.missing_referrals_given_to if member_stats else [])
                    if member_id in member_lookup
                ],
                'missing_referrals_received_from': [
                    {
                        'id': member_id,
                        'name': member_lookup.get(member_id, 'Unknown')
                    }
                    for member_id in (member_stats.missing_referrals_received_from if member_stats else [])
                    if member_id in member_lookup
                ],
                'priority_connections': [
                    {
                        'id': member_id,
                        'name': member_lookup.get(member_id, 'Unknown')
                    }
                    for member_id in (member_stats.priority_connections if member_stats else [])
                    if member_id in member_lookup
                ]
            },
            'monthly_report': {
                'id': monthly_report.id,
                'month_year': monthly_report.month_year,
                'processed_at': monthly_report.processed_at
            }
        }
        
        return Response(result)
        
    except (Chapter.DoesNotExist, MonthlyReport.DoesNotExist, Member.DoesNotExist):
        return Response(
            {'error': 'Chapter, monthly report, or member not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Member detail retrieval failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_tyfcb_data(request, chapter_id, report_id):
    """Get TYFCB data for a specific monthly report."""
    try:
        from chapters.models import MonthlyReport
        
        chapter = Chapter.objects.get(id=chapter_id)
        monthly_report = MonthlyReport.objects.get(id=report_id, chapter=chapter)
        
        tyfcb_data = {
            'inside': monthly_report.tyfcb_inside_data or {'total_amount': 0, 'count': 0, 'by_member': {}},
            'outside': monthly_report.tyfcb_outside_data or {'total_amount': 0, 'count': 0, 'by_member': {}},
            'month_year': monthly_report.month_year,
            'processed_at': monthly_report.processed_at
        }
        
        return Response(tyfcb_data)
        
    except Chapter.DoesNotExist:
        return Response(
            {'error': 'Chapter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except MonthlyReport.DoesNotExist:
        return Response(
            {'error': 'Monthly report not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to get TYFCB data: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
