import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, FileText, Clock, Sparkles, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, CourseAssignment, GeneratedContent } from '../../lib/supabase';
import { generateCourseContent } from '../../lib/openrouter';

// Simple markdown-to-HTML converter for basic formatting
const formatContent = (content) => {
  if (!content) return '';
  
  let formatted = content
    // Convert ### headers to h3
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800">$1</h3>')
    // Convert ## headers to h2
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-3 text-gray-800">$1</h2>')
    // Convert # headers to h1
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-900">$1</h1>')
    // Convert bullet points - handle both * and - at start of line
    .replace(/^[\*\-] (.*)$/gm, '<li class="ml-4 mb-1">$1</li>')
    // Convert **bold** to <strong> (but not bullet points)
    .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
    // Convert remaining single * for italic (not at start of line)
    .replace(/(?<!^)\*([^\*\n]+)\*/g, '<em>$1</em>')
    // Convert line breaks to <br> tags
    .replace(/\n/g, '<br>');

  // Wrap consecutive list items in ul tags
  formatted = formatted.replace(/(<li.*?<\/li><br>?)+/g, function(match) {
    const listItems = match.replace(/<br>/g, '');
    return `<ul class="list-disc list-inside my-3 ml-4 space-y-1">${listItems}</ul>`;
  });

  return formatted;
};

export function LecturerDashboard() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [contentType, setContentType] = useState('lesson');
  const [prompt, setPrompt] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewContent, setViewContent] = useState<GeneratedContent | null>(null);

  useEffect(() => {
    if (profile) {
      fetchAssignments();
      fetchGeneratedContent();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('lecturer_id', profile?.id);

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchGeneratedContent = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('lecturer_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGeneratedContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create default prompt based on course and content type
  const createDefaultPrompt = (courseInfo, contentType) => {
    const courseTitle = courseInfo?.title || 'Selected Course';
    const courseCode = courseInfo?.code || '';
    const courseDescription = courseInfo?.description || '';
    
    const defaultPrompts = {
      lesson: `Create a comprehensive lesson plan for ${courseTitle} (${courseCode}). ${courseDescription ? `Course context: ${courseDescription}` : ''}`,
      assignment: `Create an assignment for ${courseTitle} (${courseCode}). ${courseDescription ? `Course context: ${courseDescription}` : ''}`,
      quiz: `Create quiz questions for ${courseTitle} (${courseCode}). ${courseDescription ? `Course context: ${courseDescription}` : ''}`,
      summary: `Create a course summary for ${courseTitle} (${courseCode}). ${courseDescription ? `Course context: ${courseDescription}` : ''}`,
      notes: `Create study notes for ${courseTitle} (${courseCode}). ${courseDescription ? `Course context: ${courseDescription}` : ''}`
    };
    
    return defaultPrompts[contentType] || `Create ${contentType} content for ${courseTitle}`;
  };

  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    // Find the selected course info
    const selectedCourseInfo = assignments.find(a => a.course_id === selectedCourse)?.course;
    
    // Use provided prompt or create default one
    const finalPrompt = prompt.trim() || createDefaultPrompt(selectedCourseInfo, contentType);

    setGenerating(selectedCourse);
    try {
      const content = await generateCourseContent(finalPrompt, contentType);
      
      const { error } = await supabase
        .from('generated_content')
        .insert({
          course_id: selectedCourse,
          lecturer_id: profile?.id,
          content_type: contentType,
          title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${selectedCourseInfo?.title || 'Course Content'}`,
          content,
          prompt_used: finalPrompt
        });

      if (error) throw error;

      setShowModal(false);
      setPrompt('');
      setSelectedCourse('');
      setContentType('lesson');
      fetchGeneratedContent();
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lecturer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {profile?.full_name}!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned Courses</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Content Generated</p>
                <p className="text-2xl font-bold text-gray-900">{generatedContent.length}</p>
              </div>
              <FileText className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {generatedContent.filter(c => new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Assigned Courses */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Generate Content</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No courses assigned yet</p>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium text-gray-900">{assignment.course?.title}</h3>
                      <p className="text-sm text-gray-600">{assignment.course?.code}</p>
                      <p className="text-xs text-gray-500 mt-1">{assignment.course?.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Generated Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Generated Content</h2>
              
              <div className="space-y-4">
                {generatedContent.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No content generated yet</p>
                    <p className="text-sm text-gray-400">Click "Generate Content" to get started</p>
                  </div>
                ) : (
                  generatedContent.map((content) => (
                    <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{content.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {content.course?.title} • {content.content_type}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {new Date(content.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setViewContent(content)}
                          className="ml-4 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Content Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Course Content</h2>
              
              <form onSubmit={handleGenerateContent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a course...</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.course_id} value={assignment.course_id}>
                        {assignment.course?.title} ({assignment.course?.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="lesson">Lesson Plan</option>
                  </select>
                </div>

                <div>
                 
                  {selectedCourse && (
                    <p className="text-xs text-gray-500 mt-1">
                      Default: Will generate {contentType} content for {assignments.find(a => a.course_id === selectedCourse)?.course?.title}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!!generating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Content</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Content Modal */}
      {viewContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{viewContent.title}</h2>
                  <p className="text-gray-600">{viewContent.course?.title} • {viewContent.content_type}</p>
                </div>
                <button
                  onClick={() => setViewContent(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="prose max-w-none">
                <div 
                  className="bg-gray-50 p-6 rounded-lg border leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: formatContent(viewContent.content) 
                  }}
                />
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  <strong>Original prompt:</strong> {viewContent.prompt_used}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Generated on {new Date(viewContent.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}