# accounts/models.py
# TODO: Owner = SHAHIN (US-S02)
# Expected: CustomUser(AbstractBaseUser, PermissionsMixin) + CustomUserManager
# See PROJECT_IMPLEMENTATION_KIT.md section "SHAHIN SHAFI" for full spec.
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email       = models.EmailField(unique=True)
    full_name   = models.CharField(max_length=150)
    roll_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    is_student  = models.BooleanField(default=False)
    is_teacher  = models.BooleanField(default=False)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['full_name']
    objects = CustomUserManager()

    def __str__(self):
        return self.email
