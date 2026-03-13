import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-detail-page',
  standalone:true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './detail-page.component.html',
  styleUrl: './detail-page.component.scss'
})
export class DetailPageComponent {
  user:any|undefined=undefined;
  userForm!: FormGroup;
  editMode=false;
  showToast=false;
  toastMessage=''
  constructor(
    private fb: FormBuilder,
    private authService:AuthService,
    private cdr:ChangeDetectorRef
  ){ }

  ngOnInit(): void {
    this.getUser();
  }

  getUser() {
    const storedObjectString = localStorage.getItem('user');
    if(storedObjectString) {
      this.user = JSON.parse(storedObjectString);
      this.userForm = this.fb.group({
        firstName: [this.user.first_name, [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s]*$/)]],
        lastName: [this.user.last_name,  [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s]*$/)]],
        username: [this.user.username, [Validators.required,Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]*$/)]],
        email: [this.user.email, [Validators.required, Validators.email]],
        password: [this.user.password, [Validators.required,Validators.minLength(6), Validators.maxLength(50), this.passwordStrengthValidator]],
        phone: [this.user.phone, [Validators.required, Validators.pattern(/^\d{10}$/)]],
      });
    }
    this.userForm.disable(); // start readonly
    console.log(this.user)
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

  toggleEdit() {
    this.editMode = !this.editMode;

    if (this.editMode) {
      this.userForm.enable();
    } else {
      this.userForm.disable();
    }
  }

  alertMessage(message: string) {
    this.cdr.markForCheck()
    console.log("Toast:", message);
    this.toastMessage = message;
    this.showToast = true;
    this.editMode=false;
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  opUpdate(){
    if(this.userForm.valid) {
      const userReq={
        first_name: this.userForm.get('firstName')?.value,
        last_name: this.userForm.get('lastName')?.value,
        email: this.userForm.get('email')?.value,
        username: this.userForm.get('username')?.value,
        password: this.userForm.get('password')?.value,
        phone: this.userForm.get('phone')?.value,
      }
      this.authService.updateUser(this.user.id,userReq).subscribe({
        next:(response)=>{
          this.alertMessage(response.message);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.getUser();
        },
        error:(err)=>{
          this.alertMessage(err.message);
        }
      })
    } else {
      this.alertMessage('Form Invaild');
    }
  }
}
