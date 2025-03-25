import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="form-page">
      <div class="card success-card">
        <div class="success-icon">✓</div>
        <h2>Success!</h2>
        <p>Your operation has been completed successfully.</p>
        <div class="action-buttons">
          <button type="button" class="btn btn-primary" routerLink="/customer-list">Back to Customer List</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .success-card {
      text-align: center;
      padding: 40px;
      margin-top: 50px;
    }
    
    .success-icon {
      font-size: 64px;
      color: #4caf50;
      margin-bottom: 20px;
    }
    
    h2 {
      color: #4caf50;
      margin-bottom: 20px;
    }
    
    p {
      font-size: 18px;
      margin-bottom: 30px;
    }
    
    .action-buttons {
      display: flex;
      justify-content: center;
    }
  `
})
export class SuccessComponent {
} 