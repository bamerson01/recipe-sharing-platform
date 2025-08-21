"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Edit, Settings, BookOpen, Heart } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";

function ProfileContent() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">
              {user?.user_metadata?.full_name || user?.email}
            </CardTitle>
            <CardDescription>
              Member since {user ? new Date(user.created_at).toLocaleDateString() : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">0</CardTitle>
              <CardDescription>Recipes Created</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ChefHat className="h-8 w-8 mx-auto text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">0</CardTitle>
              <CardDescription>Recipes Saved</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">0</CardTitle>
              <CardDescription>Likes Given</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Heart className="h-8 w-8 mx-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with RecipeNest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/recipes/new">
                <Button className="w-full h-16 text-lg">
                  <ChefHat className="h-5 w-5 mr-2" />
                  Create Your First Recipe
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" className="w-full h-16 text-lg">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Explore Recipes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions on RecipeNest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity yet. Start by creating your first recipe!</p>
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
