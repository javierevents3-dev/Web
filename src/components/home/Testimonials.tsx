import { useRef, useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const testimonials = [
  {
    id: 1,
    name: 'Ana & Pedro',
    event: 'Casamento',
    text: 'Não conseguimos expressar o quanto estamos satisfeitos com as fotos do nosso casamento! Cada momento foi capturado com um olhar único, sensível e artístico. As emoções ficaram registradas de forma natural e autêntica.',
    rating: 5,
    image: 'https://images.pexels.com/photos/1310522/pexels-photo-1310522.jpeg?auto=compress&cs=tinysrgb&w=1600'
  },
  {
    id: 2,
    name: 'Carolina',
    event: 'Ensaio Gestante',
    text: 'Meu ensaio de gestante foi uma experiência incrível! As fotos capturaram exatamente o que eu queria: a beleza, a expectativa e o amor desse momento tão especial da minha vida. Cada foto é uma obra de arte!',
    rating: 5,
    image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1600'
  },
  {
    id: 3,
    name: 'Família Santos',
    event: 'Ensaio Família',
    text: 'Nossa sessão familiar foi perfeita! As crianças se sentiram à vontade e isso se refletiu nas fotos. O resultado final superou nossas expectativas - fotos autênticas e cheias de vida.',
    rating: 5,
    image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=1600'
  }
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          entry.target.classList.add('appear');
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={sectionRef} className="py-20 bg-primary text-white fade-in">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title mx-auto after:left-1/2 after:-translate-x-1/2 text-white">
            {t('home.testimonials.title')}
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto px-4">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-white/10 p-8 rounded-lg text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-playfair mb-1">{testimonial.name}</h3>
                    <p className="text-secondary text-sm mb-4">{testimonial.event}</p>
                    
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          size={16}
                          className={i < testimonial.rating ? "text-secondary fill-secondary" : "text-gray-400"}
                        />
                      ))}
                    </div>
                    
                    <blockquote className="text-white/80 italic">
                      "{testimonial.text}"
                    </blockquote>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white"
            onClick={prevTestimonial}
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white"
            onClick={nextTestimonial}
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="mt-8 flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === activeIndex ? 'bg-secondary' : 'bg-white/30'
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;