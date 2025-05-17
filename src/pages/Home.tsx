
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { UserRole, BloodRequest, Appointment, Notification } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Heart,
  Award,
  MapPin,
  AlertTriangle,
  User,
  Users,
  Bell,
} from "lucide-react";

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          const [requestsData, appointmentsData] = await Promise.all([
            api.getBloodRequests(),
            api.getAppointments(),
          ]);
          
          if (user.id) {
            const notificationsData = await api.getNotifications(user.id);
            setNotifications(notificationsData);
          }
          
          setRequests(requestsData);
          setAppointments(appointmentsData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-r-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filter data based on user role
  let filteredRequests = requests;
  let filteredAppointments = appointments;

  if (user.role === UserRole.DONOR) {
    filteredAppointments = appointments.filter(
      (appointment) => appointment.donorId === user.id
    );
  } else if (user.role === UserRole.REQUESTER) {
    filteredRequests = requests.filter(
      (request) => request.requesterId === user.id
    );
  }

  const urgentRequests = filteredRequests.filter(
    (request) => request.urgency === "high" || request.urgency === "critical"
  );
  const upcomingAppointments = filteredAppointments.filter(
    (appointment) => new Date(appointment.date) > new Date()
  );
  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Welcome, {user.name}
        </h1>
        
        {user.role === UserRole.REQUESTER && (
          <Button 
            onClick={() => navigate("/requests/new")} 
            className="bg-blood-600 hover:bg-blood-700"
          >
            New Blood Request
          </Button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === UserRole.ADMIN ? "Total Requests" : 
               user.role === UserRole.REQUESTER ? "Your Requests" : 
               "Available Requests"}
            </CardTitle>
            <Heart className="h-5 w-5 text-blood-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {urgentRequests.length} urgent needs
            </p>
          </CardContent>
        </Card>
        
        {/* Card 2 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === UserRole.DONOR ? "Your Appointments" : "Upcoming Appointments"}
            </CardTitle>
            <Calendar className="h-5 w-5 text-blood-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {user.role === UserRole.DONOR ? "Scheduled donations" : "Donation sessions"}
            </p>
          </CardContent>
        </Card>
        
        {/* Card 3 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === UserRole.ADMIN ? "Total Users" : "Notifications"}
            </CardTitle>
            {user.role === UserRole.ADMIN ? 
              <Users className="h-5 w-5 text-blood-500" /> : 
              <Bell className="h-5 w-5 text-blood-500" />
            }
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.role === UserRole.ADMIN ? "4" : unreadNotifications.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.role === UserRole.ADMIN ? "Registered on platform" : "Unread messages"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content based on role */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Blood Requests */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {user.role === UserRole.DONOR ? "Available Blood Requests" : 
               user.role === UserRole.REQUESTER ? "Your Blood Requests" : 
               "Recent Blood Requests"}
            </CardTitle>
            <CardDescription>
              {user.role === UserRole.DONOR ? "Donate to help those in need" : 
               user.role === UserRole.REQUESTER ? "Track your active requests" : 
               "Overview of recent blood needs"}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {filteredRequests.length > 0 ? (
              <div className="space-y-4">
                {filteredRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-start space-x-4 border-b pb-4 last:border-0"
                  >
                    <div className={`rounded-full p-2 ${
                      request.urgency === "critical" 
                        ? "bg-destructive/20 text-destructive" 
                        : request.urgency === "high"
                        ? "bg-orange-200 text-orange-700"
                        : request.urgency === "medium"
                        ? "bg-yellow-200 text-yellow-700"
                        : "bg-green-200 text-green-700"
                    }`}>
                      {request.urgency === "critical" ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <Clock size={18} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">
                          {request.bloodType} Blood Needed
                        </h4>
                        <Badge
                          variant={
                            request.urgency === "critical"
                              ? "destructive"
                              : request.urgency === "high"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        For {request.requesterName}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-muted-foreground">
                        <MapPin size={12} className="mr-1" />
                        {request.location.city}, {request.location.state}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No blood requests available.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/requests")}
            >
              View All Requests
            </Button>
          </CardFooter>
        </Card>

        {/* Side Content based on role */}
        <Card className="md:row-span-2">
          {user.role === UserRole.DONOR && (
            <>
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
                <CardDescription>Rewards for your donations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 flex items-center space-x-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">First Time Donor</h4>
                    <p className="text-sm text-muted-foreground">
                      Completed your first donation
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-dashed p-4 flex items-center space-x-4 opacity-50">
                  <div className="bg-muted p-3 rounded-full">
                    <Award className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Lifesaver</h4>
                    <p className="text-sm text-muted-foreground">
                      Donate 5 times to unlock
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/achievements")}
                >
                  View All Achievements
                </Button>
              </CardFooter>
            </>
          )}

          {user.role === UserRole.REQUESTER && (
            <>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Scheduled donations</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.slice(0, 3).map((appointment) => {
                      const appointmentDate = new Date(appointment.date);
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-start space-x-3 border-b pb-3 last:border-0"
                        >
                          <div className="bg-primary/10 p-2 rounded">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              Donation Appointment
                            </h4>
                            <p className="text-sm">
                              {appointmentDate.toLocaleDateString()} at{" "}
                              {appointmentDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No upcoming appointments.
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/appointments")}
                >
                  View All Appointments
                </Button>
              </CardFooter>
            </>
          )}

          {user.role === UserRole.ADMIN && (
            <>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Recent user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 border-b pb-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">John Doe</h4>
                      <p className="text-xs text-muted-foreground">
                        Joined as Donor • 2 months ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 border-b pb-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Jane Smith</h4>
                      <p className="text-xs text-muted-foreground">
                        Joined as Donor • 1 month ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">General Hospital</h4>
                      <p className="text-xs text-muted-foreground">
                        Joined as Requester • 2 months ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/users")}
                >
                  Manage Users
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>

      {/* User-specific action buttons */}
      {user.role === UserRole.DONOR && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            className="flex-1 bg-blood-600 hover:bg-blood-700"
            onClick={() => navigate("/requests")}
          >
            Find Donation Requests
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate("/donation-history")}
          >
            View Donation History
          </Button>
        </div>
      )}

      {user.role === UserRole.REQUESTER && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            className="flex-1 bg-blood-600 hover:bg-blood-700"
            onClick={() => navigate("/requests/new")}
          >
            Create New Request
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate("/requests")}
          >
            Manage Existing Requests
          </Button>
        </div>
      )}

      {user.role === UserRole.ADMIN && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Button 
            className="bg-blood-600 hover:bg-blood-700"
            onClick={() => navigate("/users")}
          >
            Manage Users
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/requests")}
          >
            Manage Requests
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/donation-centers")}
          >
            Donation Centers
          </Button>
        </div>
      )}
    </div>
  );
};

export default Home;
