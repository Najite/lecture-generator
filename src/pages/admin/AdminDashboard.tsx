import React, { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, Plus, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, createAdminClient, Profile, Course, CourseAssignment, GeneratedContent } from '../../lib/supabase';
// import { AdminSetupInstructions } from '../../components/AdminSetupInstructions';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [lecturers, setLecturers] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form states
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [lecturerEmail, setLecturerEmail] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [lecturerPassword, setLecturerPassword] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLecturerId, setSelectedLecturerId] = useState('');

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchData();
    } else if (profile) {
      // User is authenticated but not admin
      setLoading(false);
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // Use admin client for elevated permissions
      const adminClient = createAdminClient();
      
      const [lecturersRes, coursesRes, assignmentsRes, contentRes] = await Promise.all([
        adminClient.from('profiles').select('*').eq('role', 'lecturer'),
        adminClient.from('courses').select('*'),
        adminClient.from('course_assignments').select(`
          *,
          course:courses(*),
          lecturer:profiles!course_assignments_lecturer_id_fkey(*)
        `),
        adminClient.from('generated_content').select(`
          *,
          course:courses(*),
          lecturer:profiles(*)
        `).order('created_at', { ascending: false }).limit(10)
      ]);

      if (lecturersRes.error) throw lecturersRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      if (contentRes.error) throw contentRes.error;

      setLecturers(lecturersRes.data || []);
      setCourses(coursesRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setGeneratedContent(contentRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminClient = createAdminClient();
      const { error } = await adminClient
        .from('courses')
        .insert({
          title: courseTitle,
          description: courseDescription,
          code: courseCode,
          created_by: profile?.id
        });

      if (error) throw error;

      setShowCourseModal(false);
      setCourseTitle('');
      setCourseDescription('');
      setCourseCode('');
      fetchData();
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    }
  };

  const handleCreateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminClient = createAdminClient();
      
      // Determine role based on email or explicit selection
      const userRole = lecturerEmail === 'admin@eduai.com' ? 'admin' : 'lecturer';
      
      const { data, error } = await adminClient.auth.signUp({
        email: lecturerEmail,
        password: lecturerPassword,
        options: {
          data: {
            full_name: lecturerName,
            role: userRole
          }
        }
      });

      if (error) throw error;

      // Show detailed success message
      const successMessage = `✅ Account created successfully!
      
👤 User Details:
• Email: ${lecturerEmail}
• Password: ${lecturerPassword}
• Name: ${lecturerName}
• Role: ${userRole === 'admin' ? 'Administrator' : 'Lecturer'}

🔐 Login Instructions:
${userRole === 'admin' ? 
  '• Go to /admin/login to access admin dashboard\n• You now have full administrative privileges' : 
  '• Go to /login to access lecturer dashboard\n• You can be assigned courses and generate AI content'
}

📝 Next Steps:
${userRole === 'admin' ? 
  '• Create courses and assign them to lecturers\n• Monitor content generation and user activity' : 
  '• Wait for course assignments from admin\n• Start generating AI-powered course content'
}`;

      alert(successMessage);

      setShowLecturerModal(false);
      setLecturerEmail('');
      setLecturerName('');
      setLecturerPassword('');
      
      // Refresh data after a short delay to allow for profile creation
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (error) {
      console.error('Error creating lecturer:', error);
      alert(`❌ Failed to create account: ${error.message}\n\nTip: Try using the registration forms on the homepage instead.`);
    }
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminClient = createAdminClient();
      const { error } = await adminClient
        .from('course_assignments')
        .insert({
          course_id: selectedCourseId,
          lecturer_id: selectedLecturerId,
          assigned_by: profile?.id
        });

      if (error) throw error;

      setShowAssignModal(false);
      setSelectedCourseId('');
      setSelectedLecturerId('');
      fetchData();
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Failed to assign course');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage lecturers, courses, and assignments</p>
        </div>

        {/* Setup Instructions */}
        {/* <AdminSetupInstructions /> */}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setShowLecturerModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
          <button
            onClick={() => setShowCourseModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Course</span>
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Assign Course</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lecturers</p>
                <p className="text-2xl font-bold text-gray-900">{lecturers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Course Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Content Generated</p>
                <p className="text-2xl font-bold text-gray-900">{generatedContent.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Lecturers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lecturers</h2>
            <div className="space-y-3">
              {lecturers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No lecturers registered</p>
              ) : (
                lecturers.map((lecturer) => (
                  <div key={lecturer.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{lecturer.full_name}</h3>
                      <p className="text-sm text-gray-600">{lecturer.email}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {lecturer.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Courses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Courses</h2>
            <div className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No courses created</p>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="p-3 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-600">{course.code}</p>
                    <p className="text-xs text-gray-500 mt-1">{course.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Course Assignments */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Assignments</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lecturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.course?.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.course?.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {assignment.lecturer?.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.lecturer?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Course</h2>
              
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Lecturer Modal */}
      {showLecturerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New User</h2>
              
              <form onSubmit={handleCreateLecturer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={lecturerName}
                    onChange={(e) => setLecturerName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={lecturerEmail}
                    onChange={(e) => setLecturerEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="user@example.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use admin@eduai.com to create admin account, any other email creates lecturer account
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={lecturerPassword}
                    onChange={(e) => setLecturerPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The user will use this password to log in
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLecturerModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Course Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Course</h2>
              
              <form onSubmit={handleAssignCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Lecturer
                  </label>
                  <select
                    value={selectedLecturerId}
                    onChange={(e) => setSelectedLecturerId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a lecturer...</option>
                    {lecturers.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.full_name} ({lecturer.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Assign Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}