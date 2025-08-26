from rest_framework import serializers
from chapters.models import Chapter, Member
from analytics.models import Referral, OneToOne, TYFCB, DataImportSession


class ChapterSerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chapter
        fields = ['id', 'name', 'location', 'meeting_day', 'meeting_time', 
                 'members_count', 'created_at', 'updated_at']
    
    def get_members_count(self, obj):
        return obj.members.filter(is_active=True).count()


class MemberSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    referrals_given_count = serializers.SerializerMethodField()
    referrals_received_count = serializers.SerializerMethodField()
    one_to_ones_count = serializers.SerializerMethodField()
    tyfcbs_received_count = serializers.SerializerMethodField()
    tyfcbs_received_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = ['id', 'first_name', 'last_name', 'full_name', 
                 'normalized_name', 'business_name', 'classification',
                 'email', 'phone', 'is_active', 'joined_date',
                 'referrals_given_count', 'referrals_received_count',
                 'one_to_ones_count', 'tyfcbs_received_count', 
                 'tyfcbs_received_amount']
    
    def get_referrals_given_count(self, obj):
        return obj.referrals_given.count()
    
    def get_referrals_received_count(self, obj):
        return obj.referrals_received.count()
    
    def get_one_to_ones_count(self, obj):
        return (obj.one_to_ones_as_member1.count() + 
                obj.one_to_ones_as_member2.count())
    
    def get_tyfcbs_received_count(self, obj):
        return obj.tyfcbs_received.count()
    
    def get_tyfcbs_received_amount(self, obj):
        return sum(tyfcb.amount for tyfcb in obj.tyfcbs_received.all())


class ReferralSerializer(serializers.ModelSerializer):
    giver_name = serializers.CharField(source='giver.full_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)
    
    class Meta:
        model = Referral
        fields = ['id', 'giver', 'receiver', 'giver_name', 'receiver_name',
                 'date_given', 'week_of', 'notes', 'created_at']


class OneToOneSerializer(serializers.ModelSerializer):
    member1_name = serializers.CharField(source='member1.full_name', read_only=True)
    member2_name = serializers.CharField(source='member2.full_name', read_only=True)
    
    class Meta:
        model = OneToOne
        fields = ['id', 'member1', 'member2', 'member1_name', 'member2_name',
                 'meeting_date', 'week_of', 'location', 'duration_minutes', 
                 'notes', 'created_at']


class TYFCBSerializer(serializers.ModelSerializer):
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)
    giver_name = serializers.CharField(source='giver.full_name', read_only=True)
    
    class Meta:
        model = TYFCB
        fields = ['id', 'receiver', 'giver', 'receiver_name', 'giver_name',
                 'amount', 'currency', 'within_chapter', 'date_closed', 
                 'week_of', 'description', 'created_at']


class DataImportSessionSerializer(serializers.ModelSerializer):
    chapter_name = serializers.CharField(source='chapter.name', read_only=True)
    imported_by_name = serializers.CharField(source='imported_by.username', read_only=True)
    
    class Meta:
        model = DataImportSession
        fields = ['id', 'chapter', 'chapter_name', 'file_name', 'file_size',
                 'imported_by', 'imported_by_name', 'import_date', 
                 'records_processed', 'referrals_created', 'one_to_ones_created',
                 'tyfcbs_created', 'errors_count', 'success', 'error_details']


class MemberCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new members."""
    
    class Meta:
        model = Member
        fields = ['first_name', 'last_name', 'business_name', 'classification',
                 'email', 'phone', 'joined_date', 'chapter']
    
    def create(self, validated_data):
        # Ensure normalized_name is set
        member = Member(**validated_data)
        member.normalized_name = Member.normalize_name(
            f"{member.first_name} {member.last_name}"
        )
        member.save()
        return member


class MemberUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating existing members."""
    
    class Meta:
        model = Member
        fields = ['first_name', 'last_name', 'business_name', 'classification',
                 'email', 'phone', 'joined_date', 'is_active']
    
    def update(self, instance, validated_data):
        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update normalized_name if name fields changed
        if 'first_name' in validated_data or 'last_name' in validated_data:
            instance.normalized_name = Member.normalize_name(
                f"{instance.first_name} {instance.last_name}"
            )
        
        instance.save()
        return instance


class BulkMemberUploadSerializer(serializers.Serializer):
    """Serializer for bulk member upload from Excel."""
    file = serializers.FileField()
    chapter = serializers.PrimaryKeyRelatedField(queryset=Chapter.objects.all())
    
    def validate_file(self, value):
        if not value.name.lower().endswith(('.xls', '.xlsx')):
            raise serializers.ValidationError(
                "Only .xls and .xlsx files are supported"
            )
        return value


class MatrixDataSerializer(serializers.Serializer):
    """Serializer for matrix data."""
    members = serializers.ListField(child=serializers.CharField())
    matrix = serializers.ListField(child=serializers.ListField())
    totals = serializers.DictField(required=False)
    legend = serializers.DictField(required=False)


class MemberSummarySerializer(serializers.Serializer):
    """Serializer for member summary data."""
    Member = serializers.CharField()
    Referrals_Given = serializers.IntegerField()
    Referrals_Received = serializers.IntegerField()
    Unique_Referrals_Given = serializers.IntegerField()
    Unique_Referrals_Received = serializers.IntegerField()
    One_to_Ones = serializers.IntegerField()
    Unique_One_to_Ones = serializers.IntegerField()
    TYFCB_Count_Received = serializers.IntegerField()
    TYFCB_Amount_Received = serializers.DecimalField(max_digits=12, decimal_places=2)
    TYFCB_Count_Given = serializers.IntegerField()
    TYFCB_Amount_Given = serializers.DecimalField(max_digits=12, decimal_places=2)


class TYFCBSummarySerializer(serializers.Serializer):
    """Serializer for TYFCB summary data."""
    Member = serializers.CharField()
    TYFCB_Received_Count = serializers.IntegerField()
    TYFCB_Received_Amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    TYFCB_Given_Count = serializers.IntegerField()
    TYFCB_Given_Amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    Net_Amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class DataQualityReportSerializer(serializers.Serializer):
    """Serializer for data quality report."""
    overall_quality_score = serializers.FloatField()
    total_records = serializers.IntegerField()
    total_issues = serializers.IntegerField()
    referrals = serializers.DictField()
    one_to_ones = serializers.DictField()
    tyfcbs = serializers.DictField()


class FileProcessingResultSerializer(serializers.Serializer):
    """Serializer for file processing results."""
    success = serializers.BooleanField()
    import_session_id = serializers.IntegerField(required=False)
    referrals_created = serializers.IntegerField()
    one_to_ones_created = serializers.IntegerField()
    tyfcbs_created = serializers.IntegerField()
    total_processed = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    error = serializers.CharField(required=False)