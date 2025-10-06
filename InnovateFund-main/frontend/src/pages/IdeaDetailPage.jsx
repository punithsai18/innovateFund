import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import jsPDF from "jspdf"; // <-- add this import at the top
import {
  Heart,
  MessageSquare,
  Share2,
  Eye,
  Star,
  DollarSign,
  Users,
  Calendar,
  Tag,
  ArrowLeft,
  Send,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "../services/api";
// Removed Bot and X icons import; floating button already includes its own icon
import Button from "../components/ui/Button";
import AIFloatingButton from "../components/ui/AIFloatingButton";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import toast from "react-hot-toast";

const IdeaDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentTerms, setInvestmentTerms] = useState("");
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  const navigate = useNavigate();

  // Helper: Build full context string for AI
  const buildIdeaContext = () => {
    if (!idea) return "";
    let context = `Idea Title: ${idea.title}\n`;
    context += `Description: ${idea.description}\n`;
    context += `Category: ${idea.category}\n`;
    context += `Stage: ${idea.stage}\n`;
    context += `Funding Goal: ${idea.fundingGoal}\n`;
    context += `Current Funding: ${idea.currentFunding}\n`;
    context += `Impact Score: ${idea.impactScore}\n`;
    if (idea.tags && idea.tags.length > 0)
      context += `Tags: ${idea.tags.join(", ")}\n`;
    if (idea.attachments && idea.attachments.length > 0)
      context += `Attachments: ${idea.attachments
        .map((a) => a.fileName)
        .join(", ")}\n`;
    if (idea.creator) context += `Creator: ${idea.creator.name}\n`;
    return context;
  };

  // Navigate to AI Assistant page with context
  const handleOpenAIAssistant = () => {
    navigate("/ai-assistant", {
      state: {
        ideaContext: buildIdeaContext(),
        ideaId: idea._id,
        ideaTitle: idea.title,
        userType: user?.userType,
      },
    });
  };

  // Fetch idea details
  const { data: ideaData, isLoading } = useQuery(
    ["idea", id],
    () => api.ideas.getIdea(id),
    { enabled: !!id }
  );

  const idea = ideaData?.data?.idea;

  // Like idea mutation
  const likeMutation = useMutation(() => api.ideas.likeIdea(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(["idea", id]);
      toast.success("Idea liked!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to like idea");
    },
  });

  // Add comment mutation
  const commentMutation = useMutation(
    (content) => api.ideas.addComment(id, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["idea", id]);
        setComment("");
        toast.success("Comment added!");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to add comment");
      },
    }
  );

  // Investment mutation
  const investmentMutation = useMutation(
    (data) => api.investors.makeInvestment(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["idea", id]);
        setShowInvestmentModal(false);
        setInvestmentAmount("");
        setInvestmentTerms("");
        toast.success("Investment made successfully!");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to make investment"
        );
      },
    }
  );

  // Collaboration request mutation
  const collaborationMutation = useMutation(
    () => api.ideas.requestCollaboration(id),
    {
      onSuccess: () => {
        toast.success("Collaboration request sent!");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Failed to send collaboration request"
        );
      },
    }
  );
  // Inside your component, add these new states:
const [showReportModal, setShowReportModal] = useState(false);
const [reportData, setReportData] = useState({
  reason: "",
  description: "",
  severity: "Low",
});

// Function to handle PDF generation
const handleDownloadReport = () => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Idea Report Form", 20, 20);

  doc.setFontSize(12);
  doc.text(`Idea Title: ${idea.title}`, 20, 40);
  doc.text(`Reported By: ${user?.name || "Anonymous"}`, 20, 50);
  doc.text(`Reason: ${reportData.reason}`, 20, 70);
  doc.text(`Description:`, 20, 80);

  // Wrap long text
  const splitDescription = doc.splitTextToSize(reportData.description, 170);
  doc.text(splitDescription, 20, 90);

  doc.text(`Severity: ${reportData.severity}`, 20, 120);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 130);

  doc.save(`${idea.title}_Report.pdf`);
  toast.success("Report downloaded successfully!");
  setShowReportModal(false);
};
// Function to download idea details as PDF
const handleDownloadIdeaPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Idea Details", 20, 20);

  doc.setFontSize(12);
  doc.text(`Title: ${idea.title}`, 20, 40);
  doc.text(`Category: ${idea.category}`, 20, 50);
  doc.text(`Stage: ${idea.stage}`, 20, 60);
  doc.text(`Impact Score: ${idea.impactScore}`, 20, 70);
  doc.text(`Funding Goal: ${formatCurrency(idea.fundingGoal)}`, 20, 80);
  doc.text(`Current Funding: ${formatCurrency(idea.currentFunding)}`, 20, 90);

  if (idea.tags?.length) {
    doc.text(`Tags: ${idea.tags.join(", ")}`, 20, 100);
  }

  doc.text("Description:", 20, 115);
  const splitDescription = doc.splitTextToSize(idea.description, 170);
  doc.text(splitDescription, 20, 125);

  if (idea.creator?.name)
    doc.text(`Creator: ${idea.creator.name}`, 20, 160);

  doc.text(`Date: ${new Date(idea.createdAt).toLocaleDateString()}`, 20, 170);

  doc.save(`${idea.title}_Details.pdf`);
  toast.success("Idea details downloaded as PDF!");
};


// Add this Report button in the Action Buttons section (where Like, Share, etc. are)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage) => {
    const colors = {
      idea: "bg-gray-100 text-gray-800",
      prototype: "bg-blue-100 text-blue-800",
      mvp: "bg-yellow-100 text-yellow-800",
      beta: "bg-orange-100 text-orange-800",
      launched: "bg-green-100 text-green-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate(comment.trim());
    }
  };

  const handleInvestment = (e) => {
    e.preventDefault();
    if (investmentAmount && parseFloat(investmentAmount) > 0) {
      investmentMutation.mutate({
        amount: parseFloat(investmentAmount),
        terms: investmentTerms,
      });
    }
  };

  const handleCollaboration = () => {
    collaborationMutation.mutate();
  };

  const isLiked = idea?.likes?.some((like) => like.user._id === user?._id);
  const fundingProgress = idea
    ? (idea.currentFunding / idea.fundingGoal) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Idea not found
          </h2>
          <p className="text-gray-600 mb-4">
            The idea you're looking for doesn't exist.
          </p>
          <Link to="/ideas">
            <Button>Back to Ideas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/ideas"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Ideas
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Video/Image */}
              <div className="h-64 bg-gradient-to-br from-primary-100 to-secondary-100 relative">
                {idea.videoUrl ? (
                  <video
                    src={idea.videoUrl}
                    poster={idea.thumbnailUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : idea.thumbnailUrl ? (
                  <img
                    src={idea.thumbnailUrl}
                    alt={idea.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Star className="w-10 h-10 text-primary-600" />
                      </div>
                      <p className="text-primary-600 font-medium text-lg">
                        {idea.category}
                      </p>
                    </div>
                  </div>
                )}

                {/* Impact Score */}
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="font-medium">
                      Impact Score: {idea.impactScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(
                          idea.stage
                        )}`}
                      >
                        {idea.stage}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {idea.category}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {idea.title}
                    </h1>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {idea.views} views
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(idea.createdAt).toLocaleDateString()}
                      </span>
                      <Button
  variant="outline"
  onClick={() => setShowReportModal(true)}
>
  <Tag className="w-4 h-4 mr-2" />
  Report
</Button>

// --- Now add the new Modal at the bottom, near other modals ---
<Modal
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
  title="Report This Idea"
  size="md"
>
  <form
    onSubmit={(e) => {
      e.preventDefault();
      handleDownloadReport();
    }}
    className="space-y-4"
  >
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Reason for Report
      </label>
      <select
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={reportData.reason}
        onChange={(e) =>
          setReportData({ ...reportData, reason: e.target.value })
        }
        required
      >
        <option value="">Select a reason</option>
        <option value="Inappropriate Content">Inappropriate Content</option>
        <option value="Spam or Misleading">Spam or Misleading</option>
        <option value="Copyright Violation">Copyright Violation</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        rows="4"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Describe the issue..."
        value={reportData.description}
        onChange={(e) =>
          setReportData({ ...reportData, description: e.target.value })
        }
        required
      ></textarea>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Severity
      </label>
      <select
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={reportData.severity}
        onChange={(e) =>
          setReportData({ ...reportData, severity: e.target.value })
        }
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>

    <div className="flex space-x-3 pt-4">
      <Button
        type="button"
        variant="outline"
        className="flex-1"
        onClick={() => setShowReportModal(false)}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        className="flex-1"
      >
        Download Report
      </Button>
    </div>
  </form>
</Modal>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 mb-6">

                <Button variant="outline" onClick={handleDownloadIdeaPDF}>
                  
  <Star className="w-4 h-4 mr-2" />
  PDF
</Button>
</div>
<div className="flex items-center space-x-3 mb-6">
  <Button
    variant={isLiked ? "primary" : "outline"}
    onClick={handleLike}
    loading={likeMutation.isLoading}
  >
    <Heart
      className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`}
    />
    {idea.likes?.length || 0}
  </Button>

  <Button variant="outline">
    <Share2 className="w-4 h-4 mr-2" />
    Share
  </Button>

  {/* 👇 New PDF Button */}
  <Button variant="outline" onClick={handleDownloadIdeaPDF}>
    <Star className="w-4 h-4 mr-2" />
    PDF
  </Button>

  {user?.userType === "investor" && idea.creator && user._id !== idea.creator._id && (
    <Button onClick={() => setShowInvestmentModal(true)}>
      <DollarSign className="w-4 h-4 mr-2" />
      Invest
    </Button>
  )}

  {user?.userType === "innovator" && idea.creator && user._id !== idea.creator._id && (
    <Button
      variant="outline"
      onClick={handleCollaboration}
      loading={collaborationMutation.isLoading}
    >
      <UserPlus className="w-4 h-4 mr-2" />
      Collaborate
    </Button>
  )}
</div>


                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mb-6">
                  <Button
                    variant={isLiked ? "primary" : "outline"}
                    onClick={handleLike}
                    loading={likeMutation.isLoading}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${
                        isLiked ? "fill-current" : ""
                      }`}
                    />
                    {idea.likes?.length || 0}
                  </Button>

                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>

                  {/* Ask AI moved to floating action button for consistency */}

                  {user?.userType === "investor" &&
                    idea.creator &&
                    user._id !== idea.creator._id && (
                      <Button onClick={() => setShowInvestmentModal(true)}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Invest
                      </Button>
                    )}

                  {user?.userType === "innovator" &&
                    idea.creator &&
                    user._id !== idea.creator._id && (
                      <Button
                        variant="outline"
                        onClick={handleCollaboration}
                        loading={collaborationMutation.isLoading}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Collaborate
                      </Button>
                    )}
                </div>

                {/* Description */}
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {idea.description}
                  </p>
                </div>

                {/* Tags */}
                {idea.tags && idea.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {idea.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {idea.attachments && idea.attachments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Attachments
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {idea.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                            <Tag className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {attachment.fileType}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Comments ({idea.comments?.length || 0})
              </h3>

              {/* Add Comment */}
              <form onSubmit={handleComment} className="mb-6">
                <div className="flex space-x-3">
                  <img
                    src={
                      user?.profilePicture ||
                      `https://ui-avatars.com/api/?name=${user?.name}&background=667eea&color=fff`
                    }
                    alt={user?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <Input
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mb-2"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!comment.trim()}
                      loading={commentMutation.isLoading}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Comment
                    </Button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {idea.comments?.map((comment, index) => (
                  <div key={index} className="flex space-x-3">
                    <img
                      src={
                        comment.user?.profilePicture ||
                        `https://ui-avatars.com/api/?name=${comment.user?.name}&background=667eea&color=fff`
                      }
                      alt={comment.user?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.user?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {(!idea.comments || idea.comments.length === 0) && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Funding Progress
              </h3>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(idea.currentFunding)}
                  </span>
                  <span className="text-sm text-gray-500">
                    of {formatCurrency(idea.fundingGoal)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, fundingProgress)}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {Math.round(fundingProgress)}% funded •{" "}
                  {idea.investments?.length || 0} investors
                </div>
              </div>

              {user?.userType === "investor" &&
                user._id !== idea.creator._id && (
                  <Button
                    className="w-full"
                    onClick={() => setShowInvestmentModal(true)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Invest Now
                  </Button>
                )}
            </div>

            {/* Creator Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Creator
              </h3>
              {idea.creator ? (
                <>
                  <div className="flex items-center mb-4">
                    <img
                      src={
                        idea.creator.profilePicture ||
                        `https://ui-avatars.com/api/?name=${idea.creator.name}&background=667eea&color=fff`
                      }
                      alt={idea.creator.name}
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {idea.creator.name}
                      </h4>
                      {idea.creator.company && (
                        <p className="text-sm text-gray-600">
                          {idea.creator.company}
                        </p>
                      )}
                    </div>
                  </div>

                  {idea.creator.bio && (
                    <p className="text-sm text-gray-600 mb-4">
                      {idea.creator.bio}
                    </p>
                  )}

                  <Link to={`/profile/${idea.creator._id}`}>
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-gray-500">
                  Creator information not available.
                </div>
              )}
            </div>

            {/* Collaborators */}
            {idea.collaborators && idea.collaborators.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Collaborators ({idea.collaborators.length})
                </h3>

                <div className="space-y-3">
                  {idea.collaborators.map((collaborator, index) => (
                    <div key={index} className="flex items-center">
                      <img
                        src={
                          collaborator.user?.profilePicture ||
                          `https://ui-avatars.com/api/?name=${collaborator.user?.name}&background=667eea&color=fff`
                        }
                        alt={collaborator.user?.name}
                        className="w-8 h-8 rounded-full object-cover mr-3"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {collaborator.user?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {collaborator.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Investments */}
            {idea.investments && idea.investments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Investments
                </h3>

                <div className="space-y-3">
                  {idea.investments.slice(0, 5).map((investment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <img
                          src={
                            investment.investor?.profilePicture ||
                            `https://ui-avatars.com/api/?name=${investment.investor?.name}&background=667eea&color=fff`
                          }
                          alt={investment.investor?.name}
                          className="w-8 h-8 rounded-full object-cover mr-3"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {investment.investor?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              investment.investedAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(investment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Investment Modal */}
        <Modal
          isOpen={showInvestmentModal}
          onClose={() => setShowInvestmentModal(false)}
          title="Make Investment"
          size="md"
        >
          <form onSubmit={handleInvestment} className="space-y-4">
            <div>
              <Input
                label="Investment Amount ($)"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investment Terms (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Enter any specific terms or conditions..."
                value={investmentTerms}
                onChange={(e) => setInvestmentTerms(e.target.value)}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowInvestmentModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={investmentMutation.isLoading}
                disabled={
                  !investmentAmount || parseFloat(investmentAmount) <= 0
                }
              >
                Invest{" "}
                {investmentAmount &&
                  formatCurrency(parseFloat(investmentAmount))}
              </Button>
              
            </div>
          </form>
        </Modal>
      </div>
       




  {/* Floating Ask AI Button */}
  <AIFloatingButton onClick={handleOpenAIAssistant} />
    </div>
  );
};

export default IdeaDetailPage;
