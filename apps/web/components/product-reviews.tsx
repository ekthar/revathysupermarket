"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, Send, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast-provider";

type ReviewUser = { id: string; name: string | null; image: string | null };
type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: ReviewUser;
};

interface ProductReviewsProps {
  productSlug: string;
  initialAvgRating?: number;
  initialReviewCount?: number;
}

function StarRating({
  value,
  onChange,
  size = "md",
  interactive = false,
}: {
  value: number;
  onChange?: (val: number) => void;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}) {
  const sizeMap = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-6 w-6" };
  const iconSize = sizeMap[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={interactive ? "cursor-pointer press" : "cursor-default"}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`${iconSize} transition-colors ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-neutral-300 dark:text-neutral-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarRatingDisplay({
  avgRating,
  reviewCount,
}: {
  avgRating: number;
  reviewCount: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-3xl font-black text-neutral-900 dark:text-white">
          {avgRating.toFixed(1)}
        </span>
        <StarRating value={Math.round(avgRating)} size="md" />
      </div>
      <span className="text-caption text-neutral-500 dark:text-neutral-400">
        ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
      </span>
    </div>
  );
}

export function ProductReviews({
  productSlug,
  initialAvgRating = 0,
  initialReviewCount = 0,
}: ProductReviewsProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState(initialAvgRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(
    async (pageNum: number) => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/products/${productSlug}/reviews?page=${pageNum}&limit=5`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (pageNum === 1) {
          setReviews(data.reviews);
        } else {
          setReviews((prev) => [...prev, ...data.reviews]);
        }
        setAvgRating(data.avgRating);
        setReviewCount(data.reviewCount);
        setTotalPages(data.totalPages);
        setPage(pageNum);
      } catch {
        // Silently handle fetch errors
      } finally {
        setLoading(false);
      }
    },
    [productSlug]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) {
      showToast("Please sign in to write a review", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: formRating, comment: formComment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to submit review", "error");
        return;
      }
      showToast("Review submitted!", "success");
      setShowForm(false);
      setFormComment("");
      setFormRating(5);
      // Refresh reviews
      fetchReviews(1);
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 pb-10 pt-8 md:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-5 card-shadow dark:bg-neutral-900">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-title font-bold text-neutral-900 dark:text-white">
              Ratings & Reviews
            </h2>
            {reviewCount > 0 && (
              <div className="mt-2">
                <StarRatingDisplay avgRating={avgRating} reviewCount={reviewCount} />
              </div>
            )}
            {reviewCount === 0 && !loading && (
              <p className="mt-1 text-caption text-neutral-400">
                No reviews yet. Be the first to review!
              </p>
            )}
          </div>
          {session?.user && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(!showForm)}
              className="self-start rounded-full bg-black px-4 py-2 text-caption font-bold text-white hover:bg-neutral-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-neutral-100"
            >
              Write a Review
            </motion.button>
          )}
        </div>

        {/* Write review form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
              onSubmit={handleSubmit}
            >
              <div className="mt-5 rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                <p className="text-body font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                  Your rating
                </p>
                <StarRating
                  value={formRating}
                  onChange={setFormRating}
                  size="lg"
                  interactive
                />
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Share your experience (optional)"
                  maxLength={500}
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-body text-neutral-800 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                />
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-full px-4 py-2 text-caption font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-caption font-bold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors dark:bg-white dark:text-black dark:hover:bg-neutral-100"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {submitting ? "Submitting..." : "Submit"}
                  </motion.button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Reviews list */}
        {reviews.length > 0 && (
          <div className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-4 first:pt-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <span className="text-caption font-bold text-neutral-600 dark:text-neutral-300">
                      {review.user.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {review.user.name || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-2">
                      <StarRating value={review.rating} size="sm" />
                      <span className="text-micro text-neutral-400">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-2 pl-11 text-body text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Load more */}
        {page < totalPages && (
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchReviews(page + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-caption font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
              {loading ? "Loading..." : "Load more reviews"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export { StarRatingDisplay };
