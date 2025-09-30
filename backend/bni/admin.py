from django.contrib import admin
from bni.models import (
    Chapter, Member, MonthlyReport, MemberMonthlyStats,
    Referral, OneToOne, TYFCB, DataImportSession
)

# Register all models
admin.site.register(Chapter)
admin.site.register(Member)
admin.site.register(MonthlyReport)
admin.site.register(MemberMonthlyStats)
admin.site.register(Referral)
admin.site.register(OneToOne)
admin.site.register(TYFCB)
admin.site.register(DataImportSession)
