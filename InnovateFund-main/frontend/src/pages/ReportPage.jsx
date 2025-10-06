// src/pages/ReportPage.jsx
import React, { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "react-query";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { api } from "../services/api";
import Button from "../components/ui/Button";
import "../styles/ReportPage.css";

const ReportPage = () => {
  const { id } = useParams();
  const reportRef = useRef();

  const { data: ideaData, isLoading } = useQuery(
    ["idea", id],
    () => api.ideas.getIdea(id),
    { enabled: !!id }
  );

  const idea = ideaData?.data?.idea;

  const handleDownloadPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save(`${idea.title}_Report.pdf`);
  };

  if (isLoading) {
    return <div className="report-loading">Loading report...</div>;
  }

  if (!idea) {
    return (
      <div className="report-error">
        <h2>Report not available</h2>
        <Link to="/ideas">
          <Button>Back to Ideas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>{idea.title}</h1>
        <Button onClick={handleDownloadPDF}>Download as PDF</Button>
      </div>

      <div ref={reportRef} className="report-content">
        <section>
          <h2>Idea Overview</h2>
          <p>{idea.description}</p>
        </section>

        <section>
          <h2>Category</h2>
          <p>{idea.category}</p>
        </section>

        <section>
          <h2>Stage</h2>
          <p>{idea.stage}</p>
        </section>

        <section>
          <h2>Funding Details</h2>
          <p>
            <strong>Goal:</strong> ${idea.fundingGoal} <br />
            <strong>Current Funding:</strong> ${idea.currentFunding}
          </p>
        </section>

        <section>
          <h2>Impact Score</h2>
          <p>{idea.impactScore}</p>
        </section>

        {idea.tags && idea.tags.length > 0 && (
          <section>
            <h2>Tags</h2>
            <ul>
              {idea.tags.map((tag, i) => (
                <li key={i}>{tag}</li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2>Creator Information</h2>
          {idea.creator ? (
            <>
              <p>
                <strong>Name:</strong> {idea.creator.name}
              </p>
              {idea.creator.company && (
                <p>
                  <strong>Company:</strong> {idea.creator.company}
                </p>
              )}
              {idea.creator.bio && <p>{idea.creator.bio}</p>}
            </>
          ) : (
            <p>No creator info available.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReportPage;
