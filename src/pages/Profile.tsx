import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { BloodType, UserRole } from "@/types";
import { User, Mail, Phone, MapPin, Calendar, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  bloodType: z.nativeEnum(BloodType).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      address: user?.location?.address || "",
      city: user?.location?.city || "",
      state: user?.location?.state || "",
      zipCode: user?.location?.zipCode || "",
      country: user?.location?.country || "",
      bloodType: user?.bloodType,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // In a real app, this would update the user profile via API
      await api.updateUser(user.id, {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        location: {
          ...(user.location || { latitude: 0, longitude: 0 }),
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        bloodType: data.bloodType,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 border-4 border-primary border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Your Profile</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profilePicture} alt={user.name} />
                <AvatarFallback className="text-xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center mt-4">
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>
                {user.role === UserRole.DONOR
                  ? "Blood Donor"
                  : user.role === UserRole.REQUESTER
                  ? "Blood Requester"
                  : "Administrator"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
              {user.location?.city && user.location?.state && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{`${user.location.city}, ${user.location.state}`}</span>
                </div>
              )}
              {user.role === UserRole.DONOR && user.bloodType && (
                <div className="flex items-center text-sm">
                  <Heart className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Blood Type: {user.bloodType}</span>
                </div>
              )}
              {user.role === UserRole.DONOR && user.lastDonationDate && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Last Donation: {new Date(user.lastDonationDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Edit Form */}
        <div className="md:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="account">Account Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your phone number"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {user.role === UserRole.DONOR && (
                          <FormField
                            control={form.control}
                            name="bloodType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Blood Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select your blood type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.values(BloodType).map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your address"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your city"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your state"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zip/Postal Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your zip code"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your country"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isUpdating}
                        className="bg-blood-600 hover:bg-blood-700"
                      >
                        {isUpdating ? "Updating..." : "Update Profile"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure
                    </p>
                    <Button variant="outline">Change Password</Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage how you receive notifications
                    </p>
                    <Button variant="outline">Manage Notifications</Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Account Deletion</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all your data
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Additional section for donors */}
      {user.role === UserRole.DONOR && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Donation History</CardTitle>
            <CardDescription>
              Record of your past blood donations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.id === "1" ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">General Hospital</h3>
                        <p className="text-sm text-muted-foreground">
                          April 17, 2023
                        </p>
                      </div>
                    </div>
                    <Badge>Completed</Badge>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Blood Type: {user.bloodType}</p>
                    <p>Donation Type: Whole Blood</p>
                    <p>Donation Center: Downtown Blood Center</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>You haven't made any donations yet.</p>
                <Button className="mt-4 bg-blood-600 hover:bg-blood-700" onClick={() => {}}>
                  Find Donation Opportunities
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional section for requesters */}
      {user.role === UserRole.REQUESTER && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Request Statistics</CardTitle>
            <CardDescription>
              Overview of your blood requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-blood-600">3</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-blood-600">1</div>
                  <div className="text-sm text-muted-foreground">Active Requests</div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-blood-600">2</div>
                  <div className="text-sm text-muted-foreground">Fulfilled Requests</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;
