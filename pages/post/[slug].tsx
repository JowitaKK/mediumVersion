import { GetStaticProps } from "next";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity";
import { Post } from "../../typings";
import PortableText from "react-portable-text";
import { useForm, SubmitHandler} from  "react-hook-form";
import { useState } from "react";


interface IFormInput {
 _id: string;
 //? name is optional
//  name?: string;
 name: string;
 email: string;
 comment: string; 
}

interface slugProps {
    postdupa: Post;
}

const PostS =({postdupa}: slugProps)=> {
    console.log('tutaj', postdupa);

    const [submitForm, setSubmited] = useState(false);

    const {
        register,
        handleSubmit,
        formState: {errors}
    } = useForm<IFormInput>();

    const onSubmit: SubmitHandler<IFormInput> = async (janusz) => {
        fetch("/api/createComment", {
            method: "POST",
            body: JSON.stringify(janusz),
        })
        .then(()=> {
            console.log(janusz);
            setSubmited(true);
        })
        .catch((err)=> {
            console.log(err);
            setSubmited(false);
        });
    };

  return <main> 
      <Header/>
      <img className='w-full h-40 object-cover' src={urlFor(postdupa.mainImage).url()!} alt=""/>
      <article className="max-w-3xl mx-auto p-5">
          <h1 className="text-3xl mt-10 mb-3">
              {postdupa.title}
          </h1>
          <h2 className="text-xl font-light text-gray-500 mb-2">
              {postdupa.description}
          </h2>
            <img className='h-10 w-10 rounded-full object-cover' src={urlFor(postdupa.author.image).url()!} />
            <p className="font-extralight text-sm">
                <span className="text-green-600">{postdupa.author.name}
                </span>
                - Published at {new Date(postdupa._createdAt).toLocaleString()}
            </p>
            <div>
                <PortableText 
                className=''
                 dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
                 projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!} 
                 content={postdupa.body ?? ""}
                 serializers= {{
                     h1: (props:any)=> {
                         <h1 className="text-xl font-bold my-5" {...props}/>
                     },
                     li: ({children}: any)=> (
                         <li className="ml-4 list-disc">{children}</li>
                     ),
                     link: ({href, children}: any)=> (
                         <a href={href} className='text-blue-500 hover:underline'>{children}</a>
                     ),             
                 }}
                 />
            </div>
      </article>
      <hr />

      {submitForm ? (
        <div>
            <h1>Thank You for submitting your comment </h1>
            <p>Once it has beeen approved, it will apprear bellow! </p>
        </div> 
    ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col p-5 max-w-2xl mx-auto mb-10">
          <h3 className="my-2">Enjoyed this article?</h3>
          <input 
          {...register("_id")}
          type='hidden'
          name="_id"
          value={postdupa._id}
          />
        <label htmlFor=""><span className="text-gray-700">Name</span>
        <input {...register("name", {required: true })} className="shadow border rounded py-2 px-3 form-inpit my-2 block w-full" placeholder="Jowita" type="text" />
        </label>
        <label htmlFor=""><span className="text-gray-700">Email</span>
        <input {...register("email", {required: true })} className="shadow border rounded py-2 px-3 form-inpit my-2 block w-full" placeholder="Jowita" type="email" />
        </label>
        <label htmlFor=""><span className="text-gray-700">Comment</span>
        <textarea {...register("comment", {required: true })} className="shadow border rounded py-2 px-3 form-textarea my-2 block w-full" placeholder="Jowita" rows={8} />
        </label>
        {/* errors */}
        <div className="flex flex-col p-5">
            {errors.name && (
                <span className="'text-red-500">
                    Field is required
                </span>
            )}
            {errors.comment && (
                <span className="'text-red-500">
                   Comment is required
                </span>
            )}
            {errors.email && (
                <span className="'text-red-500">
                   Email is required
                </span>
            )}
        </div>
        <input className="shadow bg-green-600 hover:bg-green-700 focus:shadow-outline focus:outline-none text-black font-bold py-2 px-4 rounded cursor-pointer" type="submit" />
      </form>
        )}
        {/* comments section */}
        <div>
            <h3>Comment</h3>
            <hr />

            {postdupa.comments.map((com)=> (
              <div key={com._id} className="flex flex-col"> 
                <div>{com.name}</div>
                <div>{com.comment} </div>
              </div>
              )
            )}
        </div>
  </main>
}

export default PostS;

export const getStaticPaths=  async() => {
    const query = `*[_type == "post"] {
        _id, 
        slug {
            current
        }
    }`;

    const posts = await sanityClient.fetch(query);

    const paths = posts.map((post: Post)=> ({
        params: {
            slug: post.slug.current
        }
    }));

    return {
        paths,
        fallback: 'blocking',
    }
}

export const getStaticProps: GetStaticProps= async ({params})=> {
    console.log('params', params)
    const query= `*[_type == 'post' && slug.current == $slug][0] {
        _id,
        _createdAt,
        title, 
        author -> {
            name, 
            image
        },
        'comments' : *[
            _type =='comment' &&
            post._ref == ^._id &&
            approved == true
        ],
        description,
        mainImage,
        slug,
        body
      }`

      const postdupa = await sanityClient.fetch(query, {
          slug: params?.slug,
      });
  
      if (!postdupa) {
          return {
              props: {
                notFound: true
              }
          }
      }

      return {
          props: {
            postdupa,
            revalidate: 60,
          }
      }
}