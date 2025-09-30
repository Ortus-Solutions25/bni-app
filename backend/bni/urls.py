from django.urls import path
from bni import views

urlpatterns = [
    # File upload
    path('upload/', views.ExcelUploadView.as_view(), name='excel_upload'),

    # Matrix endpoints (with report_id)
    path('chapters/<int:chapter_id>/reports/<int:report_id>/referral-matrix/',
         views.get_referral_matrix, name='referral_matrix'),
    path('chapters/<int:chapter_id>/reports/<int:report_id>/one-to-one-matrix/',
         views.get_one_to_one_matrix, name='one_to_one_matrix'),
    path('chapters/<int:chapter_id>/reports/<int:report_id>/combination-matrix/',
         views.get_combination_matrix, name='combination_matrix'),
    path('chapters/<int:chapter_id>/reports/<int:report_id>/tyfcb-data/',
         views.get_tyfcb_data, name='tyfcb_data'),

    # Monthly reports management
    path('chapters/<int:chapter_id>/reports/',
         views.get_monthly_reports, name='get_monthly_reports'),
    path('chapters/<int:chapter_id>/reports/<int:report_id>/',
         views.delete_monthly_report, name='delete_monthly_report'),

    # Member detail with missing interactions
    path('chapters/<int:chapter_id>/reports/<int:report_id>/members/<int:member_id>/',
         views.get_member_detail, name='get_member_detail'),

    # Summary endpoints (legacy - may need updating)
    path('chapters/<int:chapter_id>/member-summary/',
         views.get_member_summary, name='member_summary'),
    path('chapters/<int:chapter_id>/tyfcb-summary/',
         views.get_tyfcb_summary, name='tyfcb_summary'),

    # Analytics endpoints (legacy - may need updating)
    path('chapters/<int:chapter_id>/data-quality/',
         views.get_data_quality_report, name='data_quality_report'),
    path('chapters/<int:chapter_id>/import-history/',
         views.get_import_history, name='import_history'),

    # Dashboard endpoints
    path('dashboard/', views.chapter_dashboard, name='chapter_dashboard'),

    # Chapter management endpoints
    path('chapters/', views.create_chapter, name='create_chapter'),
    path('chapters/<int:chapter_id>/', views.chapter_detail, name='chapter_detail'),
    path('chapters/<int:chapter_id>/delete/', views.delete_chapter, name='delete_chapter'),

    # Member management endpoints
    path('chapters/<int:chapter_id>/members/', views.create_member, name='create_member'),
    path('chapters/<int:chapter_id>/members/<int:member_id>/', views.update_member, name='update_member'),
    path('chapters/<int:chapter_id>/members/<int:member_id>/delete/', views.delete_member, name='delete_member'),

    # Member analytics endpoint
    path('chapters/<int:chapter_id>/members/<str:member_name>/analytics/',
         views.get_member_analytics, name='member_analytics'),

    # Download all matrices as Excel
    path('chapters/<int:chapter_id>/reports/<int:report_id>/download-matrices/',
         views.download_all_matrices, name='download_all_matrices'),
]
