export class CreateUserDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  profilePhotoKey?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  postalCode?: string | null;
}
