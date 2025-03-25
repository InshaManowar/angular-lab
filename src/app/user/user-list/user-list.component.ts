import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { User } from '../user.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  userForm: User = { id: 0, name: '', email: '' };
  isEditing = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe(
      (data) => {
        this.users = data;
      },
      (error) => {
        console.error('Error fetching users:', error);
        // Display an error message to the user, e.g., using a MatSnackBar
      }
    );
  }

  saveUser(): void {
    if (this.isEditing) {
      this.userService.updateUser(this.userForm).subscribe(
        () => {
          this.loadUsers();
          this.resetForm();
        },
        (error) => {
          console.error('Error updating user:', error);
          // Display an error message to the user
        }
      );
    } else {
      this.userService.addUser(this.userForm).subscribe(
        () => {
          this.loadUsers();
          this.resetForm();
        },
        (error) => {
          console.error('Error adding user:', error);
          // Display an error message to the user
        }
      );
    }
  }

  editUser(user: User): void {
    this.userForm = { ...user };
    this.isEditing = true;
  }

  deleteUser(id: number): void {
    this.userService.deleteUser(id).subscribe(
      () => {
        this.loadUsers();
      },
      (error) => {
        console.error('Error deleting user:', error);
        // Display an error message to the user
      }
    );
  }

  resetForm(): void {
    this.userForm = { id: 0, name: '', email: '' };
    this.isEditing = false;
  }
} 