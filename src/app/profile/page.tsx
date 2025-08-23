"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  Edit,
  Settings,
  ChefHat,
  Bookmark,
  Heart,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useState, useEffect } from "react";
import { getStorageUrl } from "@/lib/storage-utils";

function ProfileContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    recipes: 0,
    saved: 0,
    likes: 0,
    followers: 0,
    following: 0
  });

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch profile data
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData.profile);
        }

        // Fetch stats
        const statsResponse = await fetch('/api/users/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-32 w-32" tabIndex={-1}>
                <AvatarImage 
                  src={profile?.avatar_key ? getStorageUrl(profile.avatar_key) : user?.user_metadata?.avatar_url} 
                />
                <AvatarFallback className="text-3xl">
                  {profile?.display_name?.[0]?.toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <h1 className="text-3xl font-bold">
                  {profile?.display_name || user?.user_metadata?.full_name || 'Chef'}
                </h1>
                {profile?.username && (
                  <p className="text-lg text-muted-foreground">
                    @{profile.username}
                  </p>
                )}
                {profile?.bio && (
                  <p className="text-muted-foreground mt-2">
                    {profile.bio}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Link href="/profile/edit">
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/profile/settings">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link href="/my-recipes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <ChefHat className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.recipes}</p>
                <p className="text-sm text-muted-foreground">Recipes</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/saved-recipes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Bookmark className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.saved}</p>
                <p className="text-sm text-muted-foreground">Saved</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/interactions/likes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.likes}</p>
                <p className="text-sm text-muted-foreground">Likes</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/connections/followers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.followers}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/connections/following">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.following}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {user ? new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">@{profile?.username || 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your recipes and content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/recipes/new">
                <Button className="w-full" variant="default">
                  <ChefHat className="h-4 w-4 mr-2" />
                  Create New Recipe
                </Button>
              </Link>
              <Link href="/my-recipes">
                <Button className="w-full" variant="outline">
                  <ChefHat className="h-4 w-4 mr-2" />
                  Manage My Recipes
                </Button>
              </Link>
              <Link href="/saved-recipes">
                <Button className="w-full" variant="outline">
                  <Bookmark className="h-4 w-4 mr-2" />
                  View Saved Recipes
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}