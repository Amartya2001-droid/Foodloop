import PostFoodForm from '../PostFoodForm';

export default function PostFoodFormExample() {
  return (
    <div className="max-w-2xl">
      <PostFoodForm onSubmit={(data) => console.log('Submitted:', data)} />
    </div>
  );
}
