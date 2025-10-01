"""
MonthlyReport ViewSet - RESTful API for Monthly Report management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from chapters.models import Chapter
from members.models import Member
from reports.models import MonthlyReport, MemberMonthlyStats


class MonthlyReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MonthlyReport operations.

    Provides:
    - list: Get all monthly reports for a chapter
    - destroy: Delete a monthly report
    - member_detail: Get detailed member information with missing interaction lists
    - tyfcb_data: Get TYFCB data for a specific report
    """
    queryset = MonthlyReport.objects.all()
    permission_classes = [AllowAny]  # TODO: Add proper authentication

    def list(self, request, chapter_id=None):
        """
        Get all monthly reports for a specific chapter.

        Returns list of monthly reports with metadata including:
        - Report IDs and dates
        - File information
        - Matrix availability flags
        """
        try:
            chapter = Chapter.objects.get(id=chapter_id)
            monthly_reports = MonthlyReport.objects.filter(chapter=chapter).order_by('-month_year')

            result = []
            for report in monthly_reports:
                result.append({
                    'id': report.id,
                    'month_year': report.month_year,
                    'uploaded_at': report.uploaded_at,
                    'processed_at': report.processed_at,
                    'slip_audit_file': report.slip_audit_file if report.slip_audit_file else None,
                    'member_names_file': report.member_names_file if report.member_names_file else None,
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

    def destroy(self, request, pk=None, chapter_id=None):
        """
        Delete a monthly report.

        Also deletes associated files from storage.
        Requires authentication.
        """
        # Override permission for this specific action
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            chapter = Chapter.objects.get(id=chapter_id)
            monthly_report = MonthlyReport.objects.get(id=pk, chapter=chapter)

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

    @action(detail=True, methods=['get'], url_path='members/(?P<member_id>[^/.]+)')
    def member_detail(self, request, pk=None, chapter_id=None, member_id=None):
        """
        Get detailed member information including missing interaction lists.

        Returns member stats and lists of:
        - Missing one-to-ones
        - Missing referrals (given and received)
        - Priority connections (members appearing in multiple missing lists)
        """
        try:
            chapter = Chapter.objects.get(id=chapter_id)
            monthly_report = MonthlyReport.objects.get(id=pk, chapter=chapter)
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

    @action(detail=True, methods=['get'], url_path='tyfcb')
    def tyfcb_data(self, request, pk=None, chapter_id=None):
        """
        Get TYFCB data for a specific monthly report.

        Returns inside and outside TYFCB data with totals and per-member breakdowns.
        """
        try:
            chapter = Chapter.objects.get(id=chapter_id)
            monthly_report = MonthlyReport.objects.get(id=pk, chapter=chapter)

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
