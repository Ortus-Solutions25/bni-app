"""
Chapter ViewSet - RESTful API for Chapter management
"""
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from chapters.models import Chapter
from members.models import Member
from analytics.models import Referral, OneToOne, TYFCB
from bni.serializers import ChapterSerializer
from bni.services.chapter_service import ChapterService


class ChapterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Chapter CRUD operations and dashboard.

    Provides:
    - list: Dashboard with all chapters and statistics
    - retrieve: Detailed chapter information with members
    - create: Create new chapter
    - destroy: Delete chapter and all members
    """
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    permission_classes = [AllowAny]  # TODO: Add proper authentication

    def list(self, request):
        """
        Get dashboard data for all chapters.

        Returns comprehensive statistics including:
        - Total members, referrals, one-to-ones, TYFCB amounts
        - Averages per member
        - Member lists
        """
        chapters = self.get_queryset()
        chapter_data = []

        for chapter in chapters:
            members = Member.objects.filter(chapter=chapter, is_active=True)
            member_count = members.count()

            # Calculate totals
            total_referrals = Referral.objects.filter(giver__chapter=chapter).count()
            total_one_to_ones = OneToOne.objects.filter(member1__chapter=chapter).count()
            total_tyfcb_inside = float(
                TYFCB.objects.filter(
                    receiver__chapter=chapter,
                    within_chapter=True
                ).aggregate(total=models.Sum('amount'))['total'] or 0
            )
            total_tyfcb_outside = float(
                TYFCB.objects.filter(
                    receiver__chapter=chapter,
                    within_chapter=False
                ).aggregate(total=models.Sum('amount'))['total'] or 0
            )

            # Calculate averages
            avg_referrals = round(total_referrals / member_count, 2) if member_count > 0 else 0
            avg_one_to_ones = round(total_one_to_ones / member_count, 2) if member_count > 0 else 0
            avg_tyfcb_inside = round(total_tyfcb_inside / member_count, 2) if member_count > 0 else 0
            avg_tyfcb_outside = round(total_tyfcb_outside / member_count, 2) if member_count > 0 else 0

            # Prepare member list
            member_list = []
            for member in members:
                member_list.append({
                    'id': member.id,
                    'name': member.full_name,
                    'business_name': member.business_name,
                    'classification': member.classification,
                    'email': member.email,
                    'phone': member.phone,
                })

            chapter_data.append({
                'id': chapter.id,
                'name': chapter.name,
                'location': chapter.location,
                'meeting_day': chapter.meeting_day,
                'meeting_time': str(chapter.meeting_time) if chapter.meeting_time else None,
                'total_members': member_count,
                'total_referrals': total_referrals,
                'total_one_to_ones': total_one_to_ones,
                'total_tyfcb_inside': total_tyfcb_inside,
                'total_tyfcb_outside': total_tyfcb_outside,
                'avg_referrals_per_member': avg_referrals,
                'avg_one_to_ones_per_member': avg_one_to_ones,
                'avg_tyfcb_inside_per_member': avg_tyfcb_inside,
                'avg_tyfcb_outside_per_member': avg_tyfcb_outside,
                'members': member_list,
            })

        return Response(chapter_data)

    def retrieve(self, request, pk=None):
        """
        Get detailed information for a specific chapter.

        Returns chapter details with all active members and their full information.
        """
        try:
            chapter = self.get_object()
        except Chapter.DoesNotExist:
            return Response(
                {'error': 'Chapter not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get all active members
        members = Member.objects.filter(chapter=chapter, is_active=True)

        # Calculate performance metrics
        total_referrals = Referral.objects.filter(giver__chapter=chapter).count()
        total_one_to_ones = OneToOne.objects.filter(member1__chapter=chapter).count()
        total_tyfcb = float(
            TYFCB.objects.filter(
                receiver__chapter=chapter
            ).aggregate(total=models.Sum('amount'))['total'] or 0
        )

        # Prepare member details
        member_details = []
        for member in members:
            # Get individual member stats
            referrals_given = Referral.objects.filter(giver=member).count()
            referrals_received = Referral.objects.filter(receiver=member).count()
            otos = OneToOne.objects.filter(
                models.Q(member1=member) | models.Q(member2=member)
            ).count()
            tyfcb_received = float(
                TYFCB.objects.filter(receiver=member).aggregate(
                    total=models.Sum('amount')
                )['total'] or 0
            )

            member_details.append({
                'id': member.id,
                'first_name': member.first_name,
                'last_name': member.last_name,
                'full_name': member.full_name,
                'business_name': member.business_name,
                'classification': member.classification,
                'email': member.email,
                'phone': member.phone,
                'is_active': member.is_active,
                'joined_date': member.joined_date,
                'referrals_given': referrals_given,
                'referrals_received': referrals_received,
                'one_to_ones': otos,
                'tyfcb_received': tyfcb_received,
            })

        chapter_data = {
            'id': chapter.id,
            'name': chapter.name,
            'location': chapter.location,
            'meeting_day': chapter.meeting_day,
            'meeting_time': str(chapter.meeting_time) if chapter.meeting_time else None,
            'created_at': chapter.created_at,
            'updated_at': chapter.updated_at,
            'total_members': members.count(),
            'total_referrals': total_referrals,
            'total_one_to_ones': total_one_to_ones,
            'total_tyfcb': total_tyfcb,
            'members': member_details,
        }

        return Response(chapter_data)

    def create(self, request):
        """
        Create a new chapter.

        Uses ChapterService for centralized chapter creation logic.
        Returns 201 if created, 200 if already exists.
        """
        name = request.data.get('name')
        if not name:
            return Response(
                {'error': 'Chapter name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        location = request.data.get('location', 'Dubai')
        meeting_day = request.data.get('meeting_day', '')
        meeting_time = request.data.get('meeting_time')

        service = ChapterService()
        chapter, created = service.get_or_create_chapter(
            name=name,
            location=location,
            meeting_day=meeting_day,
            meeting_time=meeting_time
        )

        serializer = self.get_serializer(chapter)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def destroy(self, request, pk=None):
        """
        Delete a chapter and all associated members.

        Uses ChapterService for centralized deletion logic.
        Returns count of deleted members.
        """
        try:
            chapter = self.get_object()
        except Chapter.DoesNotExist:
            return Response(
                {'error': 'Chapter not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        service = ChapterService()
        result = service.delete_chapter(chapter.id)

        return Response({
            'message': f"Chapter '{chapter.name}' deleted successfully",
            'members_deleted': result['members_deleted']
        })
