# BNI Application Data Processing Walkthrough

## Core Data Processing Pipeline

**File Upload & Processing:**
- `/backend/data_processing/services.py` → Main Excel processing service that parses PALMS slip audit reports  
- `/backend/chapters/management/commands/import_monthly_data.py` → Django management command for importing monthly audit report data

**Data Models & Storage:**
- `/backend/chapters/models.py` → MonthlyReport model stores uploaded slip audit files and processed matrix data
- `/backend/analytics/models.py` → Raw referral, one-to-one, and TYFCB data models

**Matrix Generation & API:**
- `/backend/api/views.py` → Matrix calculation endpoints that read processed data and apply summary calculations
- `/backend/api/views.py` → Excel export generation with exact formatting matching old repository

**File Storage:**
- `/backend/media/monthly_reports/slip_audits/` → Uploaded PALMS slip audit report files
- `/frontend/public/needed-data/august-slip-audit-reports/` → Sample/test slip audit reports

## Key Data Processing Components

**ExcelProcessorService (services.py:20):**
- Parses PALMS format using COLUMN_MAPPINGS (columns A-G)
- Extracts referrals, one-to-ones, and TYFCBs from uploaded files

**BNIMonthlyDataImportService (services.py:671):**
- Handles complete monthly data import including trend analysis
- Processes both current and previous month data

**Matrix Data Storage:**
- MonthlyReport stores referral_matrix_data, oto_matrix_data, combination_matrix_data as JSON fields
- Raw analytics stored in Referral, OneToOne, TYFCB models

**Matrix Calculations:**
- Combination matrix uses simple numeric mapping: 0=Neither, 1=OTO only, 2=Referral only, 3=Both
- Summary columns calculated in real-time from matrix data
- Excel export matches old repository format exactly