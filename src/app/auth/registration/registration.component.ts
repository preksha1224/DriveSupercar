import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { EmailService } from '../../services/email.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { first } from 'rxjs';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  roles = ['customer', 'car_owner'];
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private emailService: EmailService,
    private router: Router
  ) {
    this.registrationForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s]*$/)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s]*$/)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]*$/)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50), this.passwordStrengthValidator]],
      confirmPassword: ['', Validators.required],
      role: ['customer', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Initialization logic if needed
  }

  get f() {
    return this.registrationForm.controls;
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
    return !passwordValid ? { weakPassword: true } : null;
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.registrationForm.invalid) {
      this.error = 'Please correct all errors before submitting';
      return;
    }

    this.loading = true;
    this.error = '';

    const userData = {
      first_name: this.f['firstName'].value.trim(),
      last_name: this.f['lastName'].value.trim(),
      username: this.f['username'].value.trim(),
      email: this.f['email'].value.trim().toLowerCase(),
      phone: this.f['phoneNumber'].value,
      password: this.f['password'].value,
      role: this.f['role'].value
    };

    this.authService.register(userData)
      .subscribe({
        next: async (response) => {
          if (response.success) {
            // Send registration success email
            if (this.emailService.isConfigured()) {
              try {
                const emailResult = await this.emailService.sendRegistrationSuccessEmail(
                  userData.email,
                  userData.first_name,
                  userData.last_name
                );
                
                if (emailResult.success) {
                  console.log('✓ Welcome email sent to:', userData.email);
                } else {
                  console.warn('⚠️  Failed to send welcome email:', emailResult.message);
                }
              } catch (emailError) {
                console.error('⚠️  Email sending error:', emailError);
              }
            } else {
              console.warn('⚠️  EmailJS not configured - skipping welcome email');
            }
            
            // Navigate to login regardless of email result
            this.router.navigate(['/user/login']);
          }
        },
        error: (error) => {
          this.error = error.error?.message || 'Registration failed. Please try again.';
          this.loading = false;
        }
      });
  }
}
