import { Link } from 'react-router-dom';
import { Brain, Users, Sparkles, BookOpen, ArrowRight, CheckCircle,  } from 'lucide-react';

export function Landing() {
 

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-500/20 p-3 rounded-full">
                <Brain className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI-Powered Course Content
              <span className="block text-blue-200">For Modern Educators</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Generate comprehensive course materials, lesson plans, and educational content instantly with our advanced AI platform
            </p>
           
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
                >
                  Get Started as Lecturer
                  <ArrowRight className="inline-block ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105"
                >
                  Create Lecturer Account
                </Link>
                <Link
                  to="/admin/login"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
                >
                  Admin Access
                </Link>
                <Link
                  to="/admin/register"
                  className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-all duration-200"
                >
                  Create Admin Account
                </Link>
              </div>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Create Amazing Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI with intuitive design to help educators create engaging content effortlessly
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-lg transition-all duration-200">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Content Generation</h3>
              <p className="text-gray-600">
                Generate comprehensive lesson plans, assignments, quizzes, and course materials using advanced AI models
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 hover:shadow-lg transition-all duration-200">
              <div className="bg-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Admin Management</h3>
              <p className="text-gray-600">
                Comprehensive admin dashboard to manage lecturers, assign courses, and oversee content creation
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-100 hover:shadow-lg transition-all duration-200">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Course Organization</h3>
              <p className="text-gray-600">
                Organize courses, track assignments, and maintain a structured learning environment for all users
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose EduAI?
              </h2>
              <div className="space-y-4">
                {[
                  'Save hours of content preparation time',
                  'Generate diverse educational materials instantly',
                  'Maintain consistent quality across all courses',
                  'Easy-to-use interface for all skill levels',
                  'Secure role-based access control',
                  'Scalable solution for institutions of any size'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  Start Creating Content
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900">For Lecturers</h4>
                  <p className="text-blue-700 text-sm">Generate course content, lesson plans, and assignments with AI assistance</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-emerald-900">For Administrators</h4>
                  <p className="text-emerald-700 text-sm">Manage lecturers, assign courses, and oversee content quality</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900">For Institutions</h4>
                  <p className="text-purple-700 text-sm">Scalable solution with comprehensive reporting and analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Course Creation?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of educators who are already using AI to create better course content
          </p>
          <Link
            to="/login"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 inline-flex items-center"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-6 w-6" />
            <span className="text-lg font-semibold">EduAI</span>
          </div>
          <p className="text-center text-gray-400 mt-4">
            © 2025 EduAI. Empowering educators with AI-generated content.
          </p>
        </div>
      </footer>
    </div>
  );
}