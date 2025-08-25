from django.urls import path
from . import views

urlpatterns = [
    # File upload
    path('upload/', views.ExcelUploadView.as_view(), name='excel_upload'),
    
    # Matrix endpoints  
    path('chapters/<int:chapter_id>/referral-matrix/', 
         views.get_referral_matrix, name='referral_matrix'),
    path('chapters/<int:chapter_id>/one-to-one-matrix/', 
         views.get_one_to_one_matrix, name='one_to_one_matrix'),
    path('chapters/<int:chapter_id>/combination-matrix/', 
         views.get_combination_matrix, name='combination_matrix'),
    
    # Summary endpoints
    path('chapters/<int:chapter_id>/member-summary/', 
         views.get_member_summary, name='member_summary'),
    path('chapters/<int:chapter_id>/tyfcb-summary/', 
         views.get_tyfcb_summary, name='tyfcb_summary'),
    
    # Analytics endpoints
    path('chapters/<int:chapter_id>/data-quality/', 
         views.get_data_quality_report, name='data_quality_report'),
    path('chapters/<int:chapter_id>/import-history/', 
         views.get_import_history, name='import_history'),
]