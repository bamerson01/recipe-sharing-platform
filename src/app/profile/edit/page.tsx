"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Mail, Calendar, Camera, X, Eye, EyeOff } from "lucide-react";
import { getStorageUrl } from "@/lib/storage-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(50, "Display name must be less than 50 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
  confirm_password: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_key: string | null;
  created_at: string;
}

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isValid: isPasswordValid },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch('/api/profile');

        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);

          // Set form values with defaults from email if not set
          const emailPrefix = user.email?.split('@')[0] || '';
          setValue('display_name', data.profile.display_name || emailPrefix);
          setValue('username', data.profile.username || emailPrefix);
          setValue('bio', data.profile.bio || '');
        } else {
          setError('Failed to load profile');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, setValue]);

  // Avatar upload functions
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Avatar image must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;

    try {
      setUploadingAvatar(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, avatar_key: data.avatar_key } : null);
        setAvatarFile(null);
        setAvatarPreview(null);
        setSuccess('Avatar updated successfully!');
        // Refresh the page to update all components that use the avatar
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to update avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;

    try {
      setUploadingAvatar(true);
      setError(null);

      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, avatar_key: null } : null);
        setAvatarFile(null);
        setAvatarPreview(null);
        setSuccess('Avatar removed successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      setError('Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setProfile(prev => prev ? { ...prev, ...data } : null);

        // Redirect to profile page after a short delay
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!user) return;

    try {
      setChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        resetPasswordForm();
        setShowPasswordForm(false);

        // Clear success message after delay
        setTimeout(() => {
          setPasswordSuccess(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-destructive">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
        <p className="text-muted-foreground">
          Update your profile information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your display name and username. These will be visible to other users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Profile Display */}
          <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src={getStorageUrl(profile.avatar_key) || undefined} />
              <AvatarFallback className="text-lg">
                {profile.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{profile.display_name || 'Not set'}</span>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
              {profile.bio && (
                <div className="flex items-start space-x-2 mt-2">
                  <div className="w-4 h-4 mt-0.5 text-muted-foreground">💬</div>
                  <p className="text-sm text-muted-foreground italic">
                    &ldquo;{profile.bio}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Avatar Upload Section */}
          <div className="space-y-4">
            <Label>Profile Picture</Label>
            <div className="flex items-center space-x-4">
              {/* Current Avatar Display */}
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={avatarPreview || getStorageUrl(profile.avatar_key) || undefined}
                  />
                  <AvatarFallback className="text-lg">
                    {profile.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <div className="flex space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    tabIndex={-1}
                    autoFocus={false}
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {avatarFile ? 'Change Image' : 'Upload Image'}
                  </Button>

                  {profile.avatar_key && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeAvatar}
                      disabled={uploadingAvatar}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {avatarFile && (
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={uploadAvatar}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Save Image'
                      )}
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Upload a profile picture (JPG, PNG, GIF up to 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                placeholder="Enter your display name"
                {...register("display_name")}
                className={errors.display_name ? "border-destructive" : ""}
              />
              {errors.display_name && (
                <p className="text-sm text-destructive">{errors.display_name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This is how your name will appear to other users
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                {...register("username")}
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Username can only contain letters, numbers, hyphens, and underscores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                placeholder="Tell us a bit about yourself..."
                {...register("bio")}
                className={`min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.bio ? "border-destructive" : ""
                  }`}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional: Share a bit about yourself (max 500 characters)
              </p>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/profile')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your account password for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </Button>
          ) : (
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    {...registerPassword("current_password")}
                    className={passwordErrors.current_password ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordErrors.current_password && (
                  <p className="text-sm text-destructive">{passwordErrors.current_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    {...registerPassword("new_password")}
                    className={passwordErrors.new_password ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordErrors.new_password && (
                  <p className="text-sm text-destructive">{passwordErrors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    {...registerPassword("confirm_password")}
                    className={passwordErrors.confirm_password ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordErrors.confirm_password && (
                  <p className="text-sm text-destructive">{passwordErrors.confirm_password.message}</p>
                )}
              </div>

              {/* Password Error and Success Messages */}
              {passwordError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                  <p className="text-sm text-green-600">{passwordSuccess}</p>
                </div>
              )}

              {/* Password Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    resetPasswordForm();
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  disabled={changingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isPasswordValid || changingPassword}
                  className="flex-1"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
