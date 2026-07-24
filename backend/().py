# coding: utf-8
from accounts.models import CustomUser
user = CustomUser.objects.get(email="admin@apptist.com")
print(user.email, user.is_active, user.is_teacher)
