import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiEdit2, FiMessageCircle, FiStar, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Loader from './Loader';
import {
  fetchProductReviews,
  createProductReview,
  updateProductReview,
  deleteProductReview,
  selectProductReviewsData,
  selectProductReviewsLoading,
  selectProductReviewsError,
  selectProductReviewMutationState
} from '../redux/slices/productSlice';

const EMPTY_BREAKDOWN = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
const STAR_STEPS = [5, 4, 3, 2, 1];
const RATING_OPTIONS = [1, 2, 3, 4, 5];

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return '';
  }
};

const ProductReviewsSection = ({ productId }) => {
  const dispatch = useDispatch();
  const reviewsData = useSelector(selectProductReviewsData);
  const reviewsLoading = useSelector(selectProductReviewsLoading);
  const reviewsError = useSelector(selectProductReviewsError);
  const mutationState = useSelector(selectProductReviewMutationState);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const { items: reviews, rating, breakdown = EMPTY_BREAKDOWN, viewerReview } = reviewsData;

  const [composerOpen, setComposerOpen] = useState(false);
  const [formState, setFormState] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    if (!productId) return;
    dispatch(fetchProductReviews({ productId }));
  }, [dispatch, productId, isAuthenticated]);

  useEffect(() => {
    if (viewerReview) {
      setFormState({
        rating: viewerReview.rating || 5,
        title: viewerReview.title || '',
        comment: viewerReview.comment || ''
      });
    } else {
      setFormState({ rating: 5, title: '', comment: '' });
    }
  }, [viewerReview]);

  const breakdownStats = useMemo(() => {
    const counts = { ...EMPTY_BREAKDOWN, ...(breakdown || {}) };
    const total = rating?.count || 0;
    const percentages = Object.entries(counts).reduce((acc, [score, value]) => {
      acc[score] = total ? Math.round((value / total) * 100) : 0;
      return acc;
    }, {});
    return { counts, percentages, total };
  }, [breakdown, rating]);

  const toggleComposer = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to share your experience.');
      return;
    }
    if (viewerReview && !viewerReview.canEdit) {
      toast.info('This review cannot be edited from this account.');
      return;
    }
    setComposerOpen((prev) => !prev);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!productId) return;
    if (viewerReview && !viewerReview.canEdit) {
      toast.info('This review cannot be edited from this account.');
      return;
    }

    const trimmedTitle = formState.title.trim();
    const trimmedComment = formState.comment.trim();

    if (!formState.rating) {
      toast.error('Please select a star rating.');
      return;
    }

    if (trimmedTitle && trimmedTitle.length < 3) {
      toast.error('Title must be at least 3 characters.');
      return;
    }

    if (trimmedComment && trimmedComment.length < 10) {
      toast.error('Comment must be at least 10 characters if provided.');
      return;
    }

    const payload = {
      rating: formState.rating,
      title: trimmedTitle || undefined,
      comment: trimmedComment || undefined
    };

    try {
      if (viewerReview?.canEdit) {
        await dispatch(updateProductReview({ productId, reviewId: viewerReview._id, payload })).unwrap();
        toast.success('Review updated.');
      } else {
        await dispatch(createProductReview({ productId, payload })).unwrap();
        toast.success('Thanks for sharing your review!');
      }
      setComposerOpen(false);
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to save review.');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!productId || !reviewId) return;
    const confirmed = window.confirm('Delete your review? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await dispatch(deleteProductReview({ productId, reviewId })).unwrap();
      toast.success('Review removed.');
      setComposerOpen(false);
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to delete review.');
    }
  };

  const renderStars = (value) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(value || 0);
        return (
          <FiStar
            key={`rating-${index}`}
            className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        );
      })}
    </div>
  );

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full lg:w-1/3">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Collector voices</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-4xl font-black">{(rating?.average || 0).toFixed(1)}</span>
            <span className="text-sm text-gray-500">{rating?.count || 0} reviews</span>
          </div>
          <div className="mt-2">
            {renderStars(rating?.average || 0)}
          </div>
          <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
            <FiMessageCircle /> Real buyers receive a WhatsApp mockup before rating us.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleComposer}
              className="px-4 py-2 rounded-full border border-gray-900 text-gray-900 font-semibold text-sm"
            >
              {viewerReview ? 'Share an update' : 'Write a review'}
            </button>
            {!isAuthenticated && (
              <Link
                to={`/login?redirect=/products/${productId}`}
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm"
              >
                Sign in to rate
              </Link>
            )}
          </div>
        </div>
        <div className="w-full lg:w-2/3 space-y-3">
          {STAR_STEPS.map((score) => {
            const percent = breakdownStats.percentages[score] || 0;
            return (
              <div key={score} className="flex items-center gap-3">
                <span className="w-12 text-sm font-semibold text-gray-600">{score}★</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-gray-500">{breakdownStats.counts[score]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {composerOpen && isAuthenticated && (!viewerReview || viewerReview.canEdit) && (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-[#faf7f2]">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Your rating</p>
            <div className="flex items-center gap-2">
              {RATING_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, rating: value }))}
                  className={`p-2 rounded-full border ${
                    formState.rating >= value ? 'border-yellow-400 bg-white' : 'border-transparent'
                  }`}
                >
                  <FiStar
                    className={`w-5 h-5 ${
                      formState.rating >= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Headline (optional)</label>
              <input
                type="text"
                name="title"
                value={formState.title}
                onChange={handleInputChange}
                placeholder="Loved the finish"
                className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Comment (optional)</label>
              <textarea
                name="comment"
                value={formState.comment}
                onChange={handleInputChange}
                placeholder="Tell other collectors how the fit, finish, and service felt."
                className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {viewerReview?.status === 'hidden' && (
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3">
              Your review is hidden right now. Update it or contact support if you need help.
            </p>
          )}

          {mutationState.error && (
            <p className="text-sm text-red-600">{mutationState.error}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={mutationState.loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white font-semibold disabled:bg-gray-400"
            >
              {viewerReview ? 'Update review' : 'Submit review'}
            </button>
            {viewerReview?.canEdit && (
              <button
                type="button"
                onClick={() => handleDelete(viewerReview._id)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 text-gray-700"
              >
                Remove review
              </button>
            )}
          </div>
        </form>
      )}

      {reviewsError && (
        <p className="text-sm text-red-600">{reviewsError}</p>
      )}

      {reviewsLoading ? (
        <div className="flex justify-center py-8">
          <Loader />
        </div>
      ) : reviews.length ? (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isOwner = viewerReview && review._id === viewerReview._id;
            return (
              <article key={review._id} className="border border-gray-100 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{review.user?.name || 'Copad collector'}</p>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    {isOwner && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Your review</span>
                    )}
                    {review.status === 'hidden' && (
                      <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Hidden</span>
                    )}
                    {review.canEdit && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <button
                          type="button"
                          onClick={() => {
                            setComposerOpen(true);
                            setFormState({
                              rating: review.rating,
                              title: review.title || '',
                              comment: review.comment || ''
                            });
                          }}
                          className="p-2 rounded-full hover:bg-gray-100"
                          title="Edit review"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(review._id)}
                          className="p-2 rounded-full hover:bg-gray-100"
                          title="Delete review"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {review.title && (
                  <p className="mt-3 text-lg font-semibold text-gray-900">{review.title}</p>
                )}
                {review.comment ? (
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">This reviewer kept it short and sweet.</p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-500">
          Be the first to review this Copad cover.
        </div>
      )}
    </section>
  );
};

export default ProductReviewsSection;
