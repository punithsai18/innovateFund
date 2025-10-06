import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Building,
  Globe,
  Linkedin,
  Edit,
  Camera,
  Star,
  TrendingUp,
  Lightbulb,
  Eye,
  Heart,
  MessageSquare,
  Save,
  X,
  Plus,
  Trash2,
  Mail,
  Calendar,
  GraduationCap,
  Users,
  Target,
  Award,
  Instagram,
  Twitter,
  Facebook,
  Youtube
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import toast from "react-hot-toast";

const ProfilePage = () => {
  // State and logic for editing ideas (must be inside component)
  const [editingIdea, setEditingIdea] = useState(null);
  const [editIdeaData, setEditIdeaData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [newSkill, setNewSkill] = useState("");
  const [newSocialLink, setNewSocialLink] = useState({ platform: "", url: "" });

  // Edit idea mutation
  const editIdeaMutation = useMutation(
    ({ id, data }) => api.ideas.editIdea(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["profile", profileId]);
        setEditingIdea(null);
        setEditIdeaData({});
        toast.success("Idea updated!");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to update idea");
      },
    }
  );

  const handleEditIdea = (idea) => {
    setEditingIdea(idea);
    setEditIdeaData({
      title: idea.title,
      description: idea.description,
      category: idea.category,
      stage: idea.stage,
      fundingGoal: idea.fundingGoal,
      tags: idea.tags?.join(", ") || "",
      status: idea.status,
    });
  };

  const handleSaveIdea = (publish = false) => {
    const data = {
      ...editIdeaData,
      tags: editIdeaData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: publish ? "published" : editIdeaData.status,
    };
    editIdeaMutation.mutate({ id: editingIdea._id, data });
  };

  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);

  const isOwnProfile = !id || id === user?._id;
  const profileId = id || user?._id;

  // Initialize profile data with comprehensive fields
  const initializeProfileData = (profile) => ({
    // Basic Information
    fullName: profile?.fullName || profile?.name || "",
    organizationName: profile?.organizationName || "",
    email: profile?.email || "",
    username: profile?.username || "",
    displayName: profile?.displayName || "",
    shortBio: profile?.shortBio || profile?.bio || "",
    location: profile?.location || "",
    dateOfBirth: profile?.dateOfBirth || "",
    gender: profile?.gender || "",
    
    // Project/Interest Information
    projectCategory: profile?.projectCategory || profile?.category || "",
    fundingGoal: profile?.fundingGoal || "",
    
    // Academic Information (for students)
    department: profile?.department || "",
    yearOfStudy: profile?.yearOfStudy || "",
    
    // Professional Information
    company: profile?.company || "",
    
    // Skills and Expertise
    skills: profile?.skills || profile?.expertise || [],
    expertiseTags: profile?.expertiseTags || [],
    sectorsOfInterest: profile?.sectorsOfInterest || [],
    
    // Social Media and Links
    website: profile?.website || "",
    socialMediaLinks: profile?.socialMediaLinks || {
      linkedin: profile?.linkedinProfile || "",
      twitter: profile?.twitter || "",
      instagram: profile?.instagram || "",
      facebook: profile?.facebook || "",
      youtube: profile?.youtube || ""
    },
    
    // Investment Range (for investors)
    investmentRange: profile?.investmentRange || { min: 0, max: 0 },
  });

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateURL = (url) => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required field validations
    if (!profileData.fullName?.trim()) {
      errors.fullName = "Full name is required";
    }
    
    if (!profileData.email?.trim()) {
      errors.email = "Email address is required";
    } else if (!validateEmail(profileData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!profileData.username?.trim()) {
      errors.username = "Username is required";
    } else if (profileData.username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    }
    
    if (!profileData.displayName?.trim()) {
      errors.displayName = "Display name is required";
    }
    
    if (profileData.shortBio?.length > 500) {
      errors.shortBio = "Bio must be less than 500 characters";
    }
    
    // URL validations
    if (profileData.website && !validateURL(profileData.website)) {
      errors.website = "Please enter a valid website URL";
    }
    
    Object.keys(profileData.socialMediaLinks || {}).forEach(platform => {
      const url = profileData.socialMediaLinks[platform];
      if (url && !validateURL(url)) {
        errors[`socialMedia_${platform}`] = `Please enter a valid ${platform} URL`;
      }
    });
    
    // Age validation for date of birth
    if (profileData.dateOfBirth) {
      const birthDate = new Date(profileData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        errors.dateOfBirth = "You must be at least 13 years old";
      }
    }
    
    // Funding goal validation
    if (profileData.fundingGoal && (isNaN(profileData.fundingGoal) || profileData.fundingGoal < 0)) {
      errors.fundingGoal = "Please enter a valid funding goal";
    }
    
    // Investment range validation for investors
    if (profile?.userType === "investor") {
      if (profileData.investmentRange?.min < 0) {
        errors.investmentRangeMin = "Minimum investment cannot be negative";
      }
      if (profileData.investmentRange?.max < profileData.investmentRange?.min) {
        errors.investmentRangeMax = "Maximum investment must be greater than minimum";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch profile data
  const { data: profileResponse, isLoading } = useQuery(
    ["profile", profileId],
    () => api.users.getProfile(profileId),
    { enabled: !!profileId }
  );

  const profile = profileResponse?.data?.user;
  const ideas = profileResponse?.data?.ideas || [];

  // Update profile mutation with enhanced data
  const updateProfileMutation = useMutation(
    (data) => api.users.updateProfile(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(["profile", profileId]);
        updateUser(response.data.user);
        setIsEditing(false);
        setFormErrors({});
        toast.success("Profile updated successfully!");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update profile"
        );
      },
    }
  );

  // Upload profile picture mutation
  const uploadPictureMutation = useMutation(
    (file) => api.users.uploadProfilePicture(file),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(["profile", profileId]);
        updateUser({ profilePicture: response.data.profilePicture });
        toast.success("Profile picture updated!");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to upload picture"
        );
      },
    }
  );

  // Delete profile mutation
  const deleteProfileMutation = useMutation(
    () => api.users.deleteProfile(),
    {
      onSuccess: () => {
        toast.success("Profile deleted successfully!");
        // Redirect logic here
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to delete profile"
        );
      },
    }
  );

  const handleEditProfile = () => {
    setProfileData(initializeProfileData(profile));
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    if (validateForm()) {
      updateProfileMutation.mutate(profileData);
    } else {
      toast.error("Please fix the form errors before saving");
    }
  };

  const handleDeleteProfile = () => {
    if (window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
      deleteProfileMutation.mutate();
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      uploadPictureMutation.mutate(file);
    }
  };

  const formatCurrency = (amount) => {
    const safeAmount = Number(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(isNaN(safeAmount) ? 0 : safeAmount);
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const addSocialLink = () => {
    if (newSocialLink.platform && newSocialLink.url && validateURL(newSocialLink.url)) {
      setProfileData((prev) => ({
        ...prev,
        socialMediaLinks: {
          ...prev.socialMediaLinks,
          [newSocialLink.platform]: newSocialLink.url,
        },
      }));
      setNewSocialLink({ platform: "", url: "" });
    } else {
      toast.error("Please enter a valid social media URL");
    }
  };

  const removeSocialLink = (platform) => {
    setProfileData((prev) => ({
      ...prev,
      socialMediaLinks: {
        ...prev.socialMediaLinks,
        [platform]: "",
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile not found
          </h2>
          <p className="text-gray-600">
            The profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const socialPlatformIcons = {
    linkedin: Linkedin,
    twitter: Twitter,
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={
                  profile.profilePicture ||
                  `https://ui-avatars.com/api/?name=${profile.fullName || profile.name || profile.displayName}&background=667eea&color=fff&size=120`
                }
                alt={profile.fullName || profile.name || profile.displayName}
                className="w-24 h-24 rounded-full object-cover"
              />
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                    {profile.fullName || profile.name}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                    @{profile.username || profile.displayName}
                  </p>
                  <div className="flex items-center text-sm text-gray-600 dark:text-slate-400 space-x-4 mb-2">
                    <span className="capitalize font-medium text-primary-600">
                      {profile.userType}
                    </span>
                    {(profile.organizationName || profile.company) && (
                      <span className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {profile.organizationName || profile.company}
                      </span>
                    )}
                    {profile.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {profile.location}
                      </span>
                    )}
                    {profile.email && (
                      <span className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {profile.email}
                      </span>
                    )}
                  </div>
                  {(profile.shortBio || profile.bio) && (
                    <p className="text-gray-600 dark:text-slate-300 max-w-2xl">
                      {profile.shortBio || profile.bio}
                    </p>
                  )}
                </div>

                {isOwnProfile && (
                  <div className="flex space-x-2 mt-4 sm:mt-0">
                    <Button
                      variant="outline"
                      onClick={handleEditProfile}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeleteProfile}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex items-center space-x-4 mt-4">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Website
                  </a>
                )}
                {profile.socialMediaLinks && Object.entries(profile.socialMediaLinks).map(([platform, url]) => {
                  const Icon = socialPlatformIcons[platform];
                  return url ? (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-slate-800">
            {profile.userType === "innovator" ? (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {ideas.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Ideas
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {ideas.reduce(
                      (sum, idea) => sum + (idea.likes?.length || 0),
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Total Likes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {ideas.reduce(
                      (sum, idea) => sum + (Number(idea.views) || 0),
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Total Views
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {formatCurrency(
                      profile.fundingGoal || 
                      ideas.reduce(
                        (sum, idea) => sum + (Number(idea.currentFunding) || 0),
                        0
                      )
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Funding Goal
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {profile.totalInvestments || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Investments
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {profile.successfulInvestments || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Successful
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-slate-100">
                    <Star className="w-5 h-5 text-yellow-500 mr-1" />
                    {profile.reputationScore || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Reputation
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {profile.investmentRange?.min != null &&
                    profile.investmentRange?.max != null
                      ? `${formatCurrency(
                          Number(profile.investmentRange.min) || 0
                        )}-${formatCurrency(
                          Number(profile.investmentRange.max) || 0
                        )}`
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Investment Range
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Academic Info (if applicable) */}
          {(profile.department || profile.yearOfStudy) && (
            <div className="flex items-center justify-center space-x-8 mt-6 pt-6 border-t border-gray-200 dark:border-slate-800">
              {profile.department && (
                <div className="text-center">
                  <div className="flex items-center justify-center text-primary-600 mb-1">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {profile.department}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">
                    Department
                  </div>
                </div>
              )}
              {profile.yearOfStudy && (
                <div className="text-center">
                  <div className="flex items-center justify-center text-primary-600 mb-1">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {profile.yearOfStudy}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">
                    Year of Study
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ideas (for innovators) */}
            {profile.userType === "innovator" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  Ideas ({ideas.length})
                </h2>
                {ideas.length > 0 ? (
                  <div className="space-y-4">
                    {ideas.map((idea) => (
                      <div
                        key={idea._id}
                        className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-500 transition-colors bg-white dark:bg-slate-800/60"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                            {idea.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              idea.status === "published"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {idea.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">
                          {idea.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {Number(idea.views) || 0}
                            </span>
                            <span className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {idea.likes?.length || 0}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {idea.comments?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900 dark:text-slate-200">
                              {formatCurrency(Number(idea.currentFunding) || 0)}{" "}
                              / {formatCurrency(Number(idea.fundingGoal) || 0)}
                            </div>
                            {idea.status === "draft" && isOwnProfile && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditIdea(idea)}
                              >
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-slate-500">
                    No ideas yet.
                  </p>
                )}

                {/* Edit Idea Modal */}
                <Modal
                  isOpen={!!editingIdea}
                  onClose={() => setEditingIdea(null)}
                  title="Edit Idea"
                  size="lg"
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Title"
                        value={
                          typeof editIdeaData.title === "string"
                            ? editIdeaData.title
                            : editIdeaData.title ?? ""
                        }
                        onChange={(e) =>
                          setEditIdeaData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                      <Input
                        label="Category"
                        value={
                          typeof editIdeaData.category === "string"
                            ? editIdeaData.category
                            : editIdeaData.category ?? ""
                        }
                        onChange={(e) =>
                          setEditIdeaData((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Input
                      label="Stage"
                      value={
                        typeof editIdeaData.stage === "string"
                          ? editIdeaData.stage
                          : editIdeaData.stage ?? ""
                      }
                      onChange={(e) =>
                        setEditIdeaData((prev) => ({
                          ...prev,
                          stage: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Funding Goal ($)"
                      type="number"
                      value={
                        editIdeaData.fundingGoal === undefined ||
                        editIdeaData.fundingGoal === null ||
                        isNaN(Number(editIdeaData.fundingGoal))
                          ? ""
                          : String(editIdeaData.fundingGoal)
                      }
                      onChange={(e) =>
                        setEditIdeaData((prev) => ({
                          ...prev,
                          fundingGoal: e.target.value,
                        }))
                      }
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        rows={3}
                        value={editIdeaData.description || ""}
                        onChange={(e) =>
                          setEditIdeaData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Input
                      label="Tags (comma separated)"
                      value={
                        typeof editIdeaData.tags === "string"
                          ? editIdeaData.tags
                          : editIdeaData.tags ?? ""
                      }
                      onChange={(e) =>
                        setEditIdeaData((prev) => ({
                          ...prev,
                          tags: e.target.value,
                        }))
                      }
                    />
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setEditingIdea(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSaveIdea(false)}
                        loading={editIdeaMutation.isLoading}
                      >
                        Save Draft
                      </Button>
                      <Button
                        onClick={() => handleSaveIdea(true)}
                        loading={editIdeaMutation.isLoading}
                      >
                        Publish
                      </Button>
                    </div>
                  </div>
                </Modal>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills and Expertise */}
            {(profile.skills || profile.expertise) && (profile.skills?.length > 0 || profile.expertise?.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills || profile.expertise || []).map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100/80 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300"
                    >
                      <Award className="w-3 h-3 mr-1" />
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Project Category */}
            {profile.projectCategory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  Project Category
                </h3>
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-secondary-600 mr-2" />
                  <span className="text-gray-900 dark:text-slate-100 font-medium">
                    {profile.projectCategory}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Sectors of Interest */}
            {profile.sectorsOfInterest && profile.sectorsOfInterest.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  {profile.userType === "investor"
                    ? "Investment Sectors"
                    : "Sectors of Interest"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.sectorsOfInterest.map((sector, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary-100/80 dark:bg-secondary-900/30 text-secondary-800 dark:text-secondary-300"
                    >
                      <Lightbulb className="w-3 h-3 mr-1" />
                      {sector}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                Personal Information
              </h3>
              <div className="space-y-3 text-sm">
                {profile.gender && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Gender</span>
                    <span className="text-gray-900 dark:text-slate-100 font-medium">
                      {profile.gender}
                    </span>
                  </div>
                )}
                {profile.dateOfBirth && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Date of Birth</span>
                    <span className="text-gray-900 dark:text-slate-100 font-medium">
                      {new Date(profile.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {profile.userType && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-slate-400">User Type</span>
                    <span className="text-primary-600 dark:text-primary-400 font-medium capitalize">
                      {profile.userType}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Edit Profile Modal */}
        <Modal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          title="Edit Profile"
          size="xl"
        >
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Full Name / Organization Name *"
                      value={profileData.fullName || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      error={formErrors.fullName}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Organization Name (if different)"
                      value={profileData.organizationName || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, organizationName: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Email Address *"
                      type="email"
                      value={profileData.email || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      error={formErrors.email}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Username *"
                      value={profileData.username || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, username: e.target.value }))
                      }
                      error={formErrors.username}
                      required
                      placeholder="@username"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Display Name *"
                      value={profileData.displayName || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, displayName: e.target.value }))
                      }
                      error={formErrors.displayName}
                      required
                      placeholder="Public display name"
                    />
                  </div>
                  <div>
                    <Input
                      label="Location (City, Country)"
                      value={profileData.location || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="e.g., San Francisco, USA"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Bio / About You ({(profileData.shortBio || "").length}/500)
                  </label>
                  <textarea
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors.shortBio ? 'border-red-300' : 'border-gray-300'
                    }`}
                    rows={4}
                    maxLength={500}
                    value={profileData.shortBio || ""}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, shortBio: e.target.value }))
                    }
                    placeholder="Tell people about yourself, your background, expertise, and story..."
                  />
                  {formErrors.shortBio && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.shortBio}</p>
                  )}
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={profileData.dateOfBirth || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                      }
                      error={formErrors.dateOfBirth}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={profileData.gender || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, gender: e.target.value }))
                      }
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <Input
                      label="Company/Organization"
                      value={profileData.company || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, company: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Academic Information (For Students)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department / Branch
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={profileData.department || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, department: e.target.value }))
                      }
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                      <option value="Biotechnology">Biotechnology</option>
                      <option value="Aerospace Engineering">Aerospace Engineering</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year of Study
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={profileData.yearOfStudy || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, yearOfStudy: e.target.value }))
                      }
                    >
                      <option value="">Select Year</option>
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Post Graduate">Post Graduate</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Project Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Project & Interest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Category / Area of Interest
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={profileData.projectCategory || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, projectCategory: e.target.value }))
                      }
                    >
                      <option value="">Select Category</option>
                      <option value="Technology">Technology</option>
                      <option value="Art & Design">Art & Design</option>
                      <option value="Music & Audio">Music & Audio</option>
                      <option value="Social Impact">Social Impact</option>
                      <option value="Health & Medicine">Health & Medicine</option>
                      <option value="Education">Education</option>
                      <option value="Environment">Environment</option>
                      <option value="Business & Entrepreneurship">Business & Entrepreneurship</option>
                      <option value="Games & Entertainment">Games & Entertainment</option>
                      <option value="Food & Agriculture">Food & Agriculture</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Input
                      label="Funding Goal (Optional) ($)"
                      type="number"
                      value={profileData.fundingGoal || ""}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, fundingGoal: e.target.value }))
                      }
                      error={formErrors.fundingGoal}
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Expertise Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Skills & Expertise
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills / Expertise Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(profileData.skills || []).map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (e.g., Web Developer, Artist, Non-Profit)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addSkill}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sectors of Interest (comma separated)
                  </label>
                  <Input
                    placeholder="e.g., FinTech, HealthTech, EdTech, CleanTech"
                    value={(profileData.sectorsOfInterest || []).join(", ")}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        sectorsOfInterest: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                      }))
                    }
                  />
                </div>
              </div>

              {/* Website & Social Media Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Website & Social Media Links
                </h3>
                <div>
                  <Input
                    label="Website"
                    type="url"
                    value={profileData.website || ""}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, website: e.target.value }))
                    }
                    error={formErrors.website}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Social Media Profiles
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(socialPlatformIcons).map(([platform, Icon]) => (
                      <div key={platform}>
                        <div className="flex items-center mb-1">
                          <Icon className="w-4 h-4 mr-2 text-gray-500" />
                          <label className="text-sm text-gray-700 capitalize">
                            {platform}
                          </label>
                        </div>
                        <Input
                          type="url"
                          value={profileData.socialMediaLinks?.[platform] || ""}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              socialMediaLinks: {
                                ...prev.socialMediaLinks,
                                [platform]: e.target.value,
                              },
                            }))
                          }
                          error={formErrors[`socialMedia_${platform}`]}
                          placeholder={`https://${platform}.com/yourprofile`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Investment Range Section (for investors) */}
              {profile?.userType === "investor" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Investment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Minimum Investment ($)"
                        type="number"
                        value={profileData.investmentRange?.min || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            investmentRange: {
                              ...prev.investmentRange,
                              min: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        error={formErrors.investmentRangeMin}
                        placeholder="e.g., 1000"
                      />
                    </div>
                    <div>
                      <Input
                        label="Maximum Investment ($)"
                        type="number"
                        value={profileData.investmentRange?.max || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            investmentRange: {
                              ...prev.investmentRange,
                              max: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        error={formErrors.investmentRangeMax}
                        placeholder="e.g., 100000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleDeleteProfile}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  loading={deleteProfileMutation.isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Profile
                </Button>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setFormErrors({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    loading={updateProfileMutation.isLoading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ProfilePage;