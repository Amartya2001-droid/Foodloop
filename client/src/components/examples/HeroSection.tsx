import HeroSection from '../HeroSection';

export default function HeroSectionExample() {
  return (
    <HeroSection
      onPostFood={() => console.log('Post food clicked')}
      onFindFood={() => console.log('Find food clicked')}
    />
  );
}
