from django.core.management.base import BaseCommand
from chapters.models import Member

class Command(BaseCommand):
    help = 'Update members with placeholder values for missing fields'

    def handle(self, *args, **options):
        members = Member.objects.all()
        
        updated_count = 0
        for member in members:
            needs_update = False
            
            if not member.business_name:
                member.business_name = 'Business Name N/A'
                needs_update = True
            if not member.classification:
                member.classification = 'Classification N/A'
                needs_update = True
            if not member.email:
                member.email = 'email@na.com'
                needs_update = True
            if not member.phone:
                member.phone = '00000000'
                needs_update = True
            
            if needs_update:
                member.save()
                updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} members with placeholder values')
        )