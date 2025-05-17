import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { BloodType, UrgencyLevel, RequestStatus } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Calendar, Clock, Heart, Info, MapPin } from "lucide-react";

const requestSchema = z.object({
  bloodType: z.nativeEnum(BloodType, {
    required_error: "Please select a blood type",
  }),
  quantity: z.number().min(1, {
    message: "Quantity must be at least 1 unit",
  }).max(10, {
    message: "Quantity cannot exceed 10 units",
  }),
  urgency: z.nativeEnum(UrgencyLevel, {
    required_error: "Please select an urgency level",
  }),
  notes: z.string().optional(),
  expireAt: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const NewRequest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      quantity: 1,
      urgency: UrgencyLevel.MEDIUM,
      notes: "",
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      await api.createBloodRequest({
        requesterId: user.id,
        requesterName: user.name,
        bloodType: data.bloodType,
        quantity: data.quantity,
        urgency: data.urgency,
        location: user.location || {
          latitude: 0,
          longitude: 0,
          address: "Unknown",
          city: "Unknown",
          state: "Unknown",
          zipCode: "00000",
          country: "Unknown"
        },
        status: RequestStatus.PENDING,
        notes: data.notes,
        expireAt: data.expireAt ? new Date(data.expireAt) : undefined,
      });
      
      toast({
        title: "Request created",
        description: "Your blood request has been successfully created.",
      });
      
      navigate("/requests");
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem creating your request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get tomorrow's date for the min date of expiry
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Blood Request</h1>
          <p className="text-muted-foreground">Create a new request for blood donation</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Provide details about the blood you need
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="bloodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Type</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood type" />
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
                      <FormDescription>
                        <div className="flex items-center text-muted-foreground">
                          <Heart className="mr-1 h-4 w-4" />
                          Select the required blood type
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (Units)</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="py-2"
                          />
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">1</span>
                            <span className="font-medium">{field.value} units</span>
                            <span className="text-sm text-muted-foreground">10</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        <div className="flex items-center text-muted-foreground">
                          <Info className="mr-1 h-4 w-4" />
                          One unit is approximately 450-500ml
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(UrgencyLevel).map((urgency) => (
                            <SelectItem key={urgency} value={urgency}>
                              {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="mr-1 h-4 w-4" />
                          Indicates how quickly you need the blood
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expireAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input
                            type="date"
                            min={tomorrowString}
                            {...field}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="mr-1 h-4 w-4" />
                          Date when the request is no longer needed
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide any additional information about the request"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-end px-0 pb-0">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate("/requests")}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blood-600 hover:bg-blood-700"
                >
                  {isSubmitting ? "Creating..." : "Create Request"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
          <CardDescription>
            Your current location details will be used for this request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4">
            <div className="flex items-center mb-2">
              <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="font-medium">Request Location</span>
            </div>
            {user?.location ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{user.location.address}</p>
                <p>
                  {user.location.city}, {user.location.state} {user.location.zipCode}
                </p>
                <p>{user.location.country}</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Your location information is not set.</p>
                <p>Please update your profile with your location details.</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary"
                  onClick={() => navigate("/profile")}
                >
                  Update Profile
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewRequest;
