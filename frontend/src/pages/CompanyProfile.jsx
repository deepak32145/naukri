import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Star,
  MapPin,
  Globe,
  Users,
  Calendar,
  Building2,
  BadgeCheck,
} from "lucide-react";
import api from "../utils/axios";
import { useSelector } from "react-redux";
import JobCard from "../components/common/JobCard";
import Spinner from "../components/common/Spinner";
import { timeAgo, getInitials, formatDate } from "../utils/helpers";
import toast from "react-hot-toast";

const StarRating = ({ value, onChange, readOnly }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => !readOnly && onChange(s)}
        disabled={readOnly}
        className={`${s <= value ? "text-yellow-400" : "text-gray-300"} ${!readOnly ? "hover:text-yellow-400 cursor-pointer" : ""}`}
      >
        <Star
          size={readOnly ? 14 : 20}
          fill={s <= value ? "currentColor" : "none"}
        />
      </button>
    ))}
  </div>
);

const CompanyProfile = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("about");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    pros: "",
    cons: "",
    isAnonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyRes, reviewsRes, jobsRes] = await Promise.all([
          api.get(`/companies/${id}`),
          api.get(`/companies/${id}/reviews`),
          api.get("/jobs", { params: { companyId: id, limit: 10 } }),
        ]);
        setCompany(companyRes.data.company);
        setReviews(reviewsRes.data.reviews);
        setJobs(jobsRes.data.jobs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.title) {
      toast.error("Please add a title");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/companies/${id}/reviews`, reviewForm);
      setReviews([data.review, ...reviews]);
      setShowReviewForm(false);
      toast.success("Review submitted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner className="py-24" />;
  if (!company)
    return (
      <div className="text-center py-24 text-gray-500">Company not found</div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
        <div className="flex items-start gap-5">
          {company.logo?.url ? (
            <img
              src={company.logo.url}
              alt={company.name}
              className="w-20 h-20 rounded-2xl object-cover border"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Building2 size={28} className="text-indigo-600" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {company.name}
              </h1>
              {company.isVerified && (
                <BadgeCheck size={20} className="text-indigo-500" />
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              {company.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {company.location}
                </span>
              )}
              {company.size && (
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {company.size} employees
                </span>
              )}
              {company.founded && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Est. {company.founded}
                </span>
              )}
              {company.industry && <span>{company.industry}</span>}
            </div>
            {company.rating > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <StarRating value={Math.round(company.rating)} readOnly />
                <span className="text-sm text-gray-600">
                  {company.rating.toFixed(1)} ({company.reviewCount} reviews)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {["about", "jobs", "reviews"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t}{" "}
            {t === "jobs"
              ? `(${jobs.length})`
              : t === "reviews"
                ? `(${reviews.length})`
                : ""}
          </button>
        ))}
      </div>

      {tab === "about" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-3">
            About {company.name}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {company.description || "No description available."}
          </p>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
            >
              <Globe size={14} /> {company.website}
            </a>
          )}
        </div>
      )}

      {tab === "jobs" && (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No active jobs</p>
          ) : (
            jobs.map((job) => <JobCard key={job._id} job={job} />)
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-4">
          {isAuthenticated && user?.role === "candidate" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full py-2.5 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50"
                >
                  + Write a Review
                </button>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Write a Review
                  </h3>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">
                      Rating
                    </label>
                    <StarRating
                      value={reviewForm.rating}
                      onChange={(r) =>
                        setReviewForm({ ...reviewForm, rating: r })
                      }
                    />
                  </div>
                  <input
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Review title"
                  />
                  <textarea
                    value={reviewForm.pros}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, pros: e.target.value })
                    }
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Pros..."
                  />
                  <textarea
                    value={reviewForm.cons}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, cons: e.target.value })
                    }
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Cons..."
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewForm.isAnonymous}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          isAnonymous: e.target.checked,
                        })
                      }
                    />{" "}
                    Post anonymously
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                    >
                      {submitting ? "Submitting..." : "Submit Review"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-center text-gray-400 py-10">
              No reviews yet. Be the first!
            </p>
          ) : (
            reviews.map((r) => (
              <div
                key={r._id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {!r.isAnonymous && r.candidateId?.name !== "Anonymous" ? (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                        {getInitials(r.candidateId?.name)}
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                        A
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {r.isAnonymous ? "Anonymous" : r.candidateId?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StarRating value={r.rating} readOnly />
                </div>
                <h4 className="font-semibold text-gray-800 mt-3">{r.title}</h4>
                {r.pros && (
                  <p className="text-sm text-green-700 mt-2">
                    <span className="font-medium">Pros:</span> {r.pros}
                  </p>
                )}
                {r.cons && (
                  <p className="text-sm text-red-600 mt-1">
                    <span className="font-medium">Cons:</span> {r.cons}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;
