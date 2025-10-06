import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  Upload,
  X,
  FileText,
  Image,
  Video,
  Plus,
  Lightbulb,
  Target,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMutation } from "react-query";
import { api } from "../services/api";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import AIFloatingButton from "../components/ui/AIFloatingButton";
import { Bot, Send } from "lucide-react";
import { useMutation as useAIMutation } from "react-query";
import { api as apiAI } from "../services/api";
import toast from "react-hot-toast";

const CreateIdeaPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // AI Assistant modal state
  const [aiModalOpen, setAIModalOpen] = useState(false);
  const [aiMessages, setAIMessages] = useState([
    {
      id: 1,
      content:
        "Hi! I am your AI assistant. Need help crafting your idea? Ask me anything about your idea, pitch, or description!",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [aiInput, setAIInput] = useState("");

  // System prompt to encourage structured responses for auto-fill
  const aiSystemPrompt =
    "You are an assistant helping users draft startup ideas. When the user describes an idea, reply with a short helpful message AND include a JSON object with keys: title, description, category, stage, fundingGoal, tags (array of strings). Put ONLY the JSON object on its own line, no backticks.";

  // Helper: try to parse a JSON object from AI text
  const parseIdeaFromAIText = (text) => {
    if (!text) return null;
    // First, try to extract JSON inside optional markdown code fences
    const codeFenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const jsonCandidate = codeFenceMatch ? codeFenceMatch[1] : text;
    const jsonMatch = jsonCandidate.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const raw = JSON.parse(jsonMatch[0]);
        // Normalize the parsed object
        const fundingValue = raw.fundingGoal ?? raw.funding ?? raw.budget;
        const fundingGoal =
          typeof fundingValue !== "undefined"
            ? Number(String(fundingValue).replace(/[^0-9.]/g, ""))
            : undefined;
        return {
          title: raw.title,
          description: raw.description,
          category: raw.category,
          stage: raw.stage,
          fundingGoal:
            Number.isFinite(fundingGoal) && fundingGoal > 0
              ? fundingGoal
              : undefined,
          tags: Array.isArray(raw.tags) ? raw.tags : undefined,
        };
      } catch (_) {}
    }
    // Fallback: parse simple "Key: value" lines
    try {
      const lines = text.split(/\r?\n/).map((l) => l.trim());
      const get = (k) => {
        const line = lines.find((l) => l.toLowerCase().startsWith(k + ":"));
        return line ? line.split(":").slice(1).join(":").trim() : undefined;
      };
      const title = get("title");
      const description = get("description");
      const category = get("category");
      const stage = get("stage");
      const funding =
        get("funding") || get("funding goal") || get("fundinggoal");
      const tagsLine = get("tags");
      const tags = tagsLine
        ? tagsLine
            .replace(/^[\[\(]|[\]\)]$/g, "")
            .split(/[,|]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;
      const fundingGoal = funding
        ? parseFloat(funding.replace(/[^0-9.]/g, ""))
        : undefined;
      if (
        title ||
        description ||
        category ||
        stage ||
        fundingGoal ||
        (tags && tags.length)
      ) {
        return { title, description, category, stage, fundingGoal, tags };
      }
    } catch (_) {}
    return null;
  };

  // Map AI parsed data to form fields
  const applyIdeaToForm = (data) => {
    if (!data) return false;
    let applied = false;
    const toTitle = data.title?.toString().slice(0, 200);
    if (toTitle) {
      setValue("title", toTitle, { shouldValidate: true, shouldDirty: true });
      applied = true;
    }
    if (data.description) {
      setValue("description", data.description.slice(0, 2000), {
        shouldValidate: true,
        shouldDirty: true,
      });
      applied = true;
    }
    if (data.category) {
      const normalizedCategories = data.category
        .toString()
        .split(/[,&/|]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const match = categories.find((c) =>
        normalizedCategories.includes(c.toLowerCase())
      );
      if (match) {
        setValue("category", match, {
          shouldValidate: true,
          shouldDirty: true,
        });
        applied = true;
      }
    }
    if (data.stage) {
      const matchStage = stages.find(
        (s) => s.toLowerCase() === data.stage.toString().toLowerCase()
      );
      if (matchStage) {
        setValue("stage", matchStage, {
          shouldValidate: true,
          shouldDirty: true,
        });
        applied = true;
      }
    }
    if (typeof data.fundingGoal !== "undefined") {
      const num = Number(data.fundingGoal);
      if (!Number.isNaN(num) && num > 0) {
        setValue("fundingGoal", Math.round(num), {
          shouldValidate: true,
          shouldDirty: true,
        });
        applied = true;
      }
    }
    if (Array.isArray(data.tags)) {
      const cleaned = data.tags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
        .slice(0, 10);
      if (cleaned.length) {
        setTags(cleaned);
        applied = true;
      }
    }
    return applied;
  };

  // AI chat mutation
  const aiChatMutation = useAIMutation((data) => apiAI.ai.chat(data), {
    onSuccess: (response) => {
      const parsed = parseIdeaFromAIText(response.data.response);
      setAIMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: response.data.response,
          sender: "ai",
          timestamp: new Date(),
          parsedIdea: parsed || null,
        },
      ]);
    },
    onError: () => {
      setAIMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: "Sorry, I encountered an error. Please try again.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleAISend = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const userMsg = {
      id: Date.now(),
      content: aiInput.trim(),
      sender: "user",
      timestamp: new Date(),
    };
    setAIMessages((prev) => [...prev, userMsg]);
    aiChatMutation.mutate({
      messages: [
        { role: "system", content: aiSystemPrompt },
        ...aiMessages
          .filter((m) => m.sender === "user" || m.sender === "ai")
          .map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content,
          })),
        { role: "user", content: aiInput.trim() },
      ],
      context: "innovation",
    });
    setAIInput("");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const categories = [
    "technology",
    "healthcare",
    "finance",
    "education",
    "environment",
    "social",
    "consumer",
    "enterprise",
  ];

  const stages = ["idea", "prototype", "mvp", "beta", "launched"];

  // Create idea mutation
  const createIdeaMutation = useMutation((data) => api.ideas.createIdea(data), {
    onSuccess: async (response) => {
      const ideaId = response.data.idea._id;

      // Upload files if any
      if (files.length > 0) {
        try {
          await api.ideas.uploadFiles(ideaId, files);
        } catch (error) {
          console.error("File upload error:", error);
          toast.error("Idea created but file upload failed");
        }
      }

      toast.success("Idea created successfully!");
      navigate(`/ideas/${ideaId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create idea");
    },
  });

  const onSubmit = (data) => {
    const ideaData = {
      ...data,
      tags,
      fundingGoal: parseFloat(data.fundingGoal),
    };
    createIdeaMutation.mutate(ideaData);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (
      currentTag.trim() &&
      !tags.includes(currentTag.trim()) &&
      tags.length < 10
    ) {
      setTags((prev) => [...prev, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (file.type.startsWith("video/")) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (user?.userType !== "innovator") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">Only innovators can create ideas.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4"
            >
              <Lightbulb className="w-8 h-8 text-primary-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Submit Your Innovative Idea
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Share your groundbreaking idea with our community of investors and
              collaborators. Get AI-powered insights and connect with the right
              people to bring your vision to life.
            </p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary-600" />
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      label="Idea Title"
                      placeholder="Enter a compelling title for your idea"
                      error={errors.title?.message}
                      {...register("title", {
                        required: "Title is required",
                        minLength: {
                          value: 5,
                          message: "Title must be at least 5 characters",
                        },
                        maxLength: {
                          value: 200,
                          message: "Title must be less than 200 characters",
                        },
                      })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      {...register("category", {
                        required: "Category is required",
                      })}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Development Stage
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      {...register("stage", { required: "Stage is required" })}
                    >
                      <option value="">Select current stage</option>
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage.charAt(0).toUpperCase() + stage.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.stage && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.stage.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={6}
                  placeholder="Describe your idea in detail. What problem does it solve? How does it work? What makes it unique?"
                  {...register("description", {
                    required: "Description is required",
                    minLength: {
                      value: 20,
                      message: "Description must be at least 20 characters",
                    },
                    maxLength: {
                      value: 2000,
                      message: "Description must be less than 2000 characters",
                    },
                  })}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.description.message}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {watch("description")?.length || 0}/2000 characters
                </p>
              </div>

              {/* Funding Goal */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
                  Funding Information
                </h2>

                <div className="max-w-md">
                  <Input
                    label="Funding Goal ($)"
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="Enter your funding target"
                    error={errors.fundingGoal?.message}
                    {...register("fundingGoal", {
                      required: "Funding goal is required",
                      min: {
                        value: 1000,
                        message: "Minimum funding goal is $1,000",
                      },
                    })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum funding goal is $1,000
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={!currentTag.trim() || tags.length >= 10}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Add up to 10 tags to help investors find your idea
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachments (Optional)
                </label>

                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop files here, or{" "}
                    <label className="text-primary-600 hover:text-primary-500 cursor-pointer">
                      browse
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
                        onChange={(e) => handleFiles(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500">
                    Support for images, videos, PDFs, and documents (max 5
                    files, 10MB each)
                  </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          {getFileIcon(file)}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/ideas")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={createIdeaMutation.isLoading}
                  className="min-w-[120px]"
                >
                  Submit Idea
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
      {/* Ask AI Floating Button */}
      <AIFloatingButton onClick={() => setAIModalOpen(true)} />

      {/* AI Assistant Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAIModalOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary-600" /> Ask AI for Idea Help
          </span>
        }
        size="md"
      >
        <div className="flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-2">
            {aiMessages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-xs text-sm shadow-sm ${
                      msg.sender === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
                {msg.sender !== "user" && msg.parsedIdea && (
                  <div className="flex justify-start">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (applyIdeaToForm(msg.parsedIdea)) {
                          toast.success("Applied AI suggestions to the form");
                        } else {
                          toast.error("Could not extract usable fields");
                        }
                      }}
                    >
                      Use these suggestions
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {aiChatMutation.isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-2xl text-sm">
                  AI is thinking...
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleAISend} className="flex gap-2 mt-2">
            <Input
              placeholder="Ask AI about your idea, pitch, or description..."
              value={aiInput}
              onChange={(e) => setAIInput(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!aiInput.trim() || aiChatMutation.isLoading}
              loading={aiChatMutation.isLoading}
              variant="primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-gray-400 mt-2">
            AI responses are suggestions. Please review before using.
          </p>
        </div>
      </Modal>
    </div>
  );
};
export default CreateIdeaPage;
