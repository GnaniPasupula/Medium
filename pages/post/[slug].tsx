import { GetStaticProps } from "next";
import React from "react";
import PortableText from "react-portable-text";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity";
import { Post } from "../../typings";
import { useForm, SubmitHandler } from "react-hook-form";

interface IFormInput {
  _id: string;
  name: string;
  email: string;
  comment: string;
}

interface Props {
  post: Post;
}

function Post({ post }: Props) {
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    fetch("/api/createComment", {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then(() => {
        console.log(data);
        setSubmitted(true);
      })
      .catch((err) => {
        console.log(err);
        setSubmitted(false);
      });
  };

  console.log(post);
  return (
    <div>
      <Header />
      <img
        className="w-full h-40 object-cover"
        src={urlFor(post.mainImage).url()}
      />
      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
        <h2 className="text-xl font-light mb-2 text-gray-500">
          {post.description}
        </h2>
        <div className="flex items-center space-x-2">
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()}
          />
          <p className="font-extralight text-sm">
            Blog post by{" "}
            <span className="text-green-600">{post.author.name}</span> -
            Published at {new Date(post._createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-10">
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="text-3xl font-bold mb-3" {...props} />
              ),
              h2: (props: any) => (
                <h2 className="text-xl font-bold mb-2 text-black" {...props} />
              ),
              li: ({ children }: any) => <li className="mb-2" {...children} />,
              link: ({ href, children }: any) => (
                <a
                  href={href}
                  className="text-blue-600 hover:underline"
                  {...children}
                />
              ),
            }}
          />
        </div>
      </article>
      <hr className="max-w-lg my-5 mx-auto border border-yellow-500"></hr>
      {submitted ? (
        <div className="flex flex-col p-10 my-10 bg-yellow-500 text-white max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold">Thank you for submitting</h3>
          <p>Once it has been approved , it will appear below</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col p-5 mx-auto max-w-2xl mb-10"
        >
          <h3 className="text-sm text-yellow-500">Enjoyed this article</h3>
          <h4 className="text-3xl font-bold">Leave a comment below</h4>
          <hr className="py-3 mt-2"></hr>

          <input
            {...register("_id")}
            type="hidden"
            name="_id"
            value={post._id}
          />
          <label className="block mb-5">
            <span className="text-gray-700">Name</span>
            <input
              {...register("name", { required: true })}
              className="outline-none focus:ring shadow border rounded py-2 px-3 mt-1 block w-full ring-yellow-500"
              placeholder="Gnani"
              type="text"
            ></input>
          </label>
          <label className="block mb-5">
            <span className="text-gray-700">Email</span>
            <input
              {...register("email", { required: true })}
              className="outline-none focus:ring shadow border rounded py-2 px-3 mt-1 block w-full ring-yellow-500"
              placeholder="Gnani"
              type="text"
            ></input>
          </label>
          <label className="block mb-5">
            <span className="text-gray-700">Comment</span>
            <textarea
              {...register("comment", { required: true })}
              className="outline-none focus:ring shadow border rounded py-2 px-3 mt-1 block w-full ring-yellow-500 for"
              placeholder="Gnani"
              rows={8}
            ></textarea>
          </label>
          <div className="p-5 flex flex-col">
            {errors.name && (
              <p className="text-red-500 text-sm">
                - The name field is required
              </p>
            )}
            {errors.email && (
              <p className="text-red-500 text-sm">
                - The email field is required
              </p>
            )}
            {errors.comment && (
              <p className="text-red-500 text-sm">
                - The comment field is required
              </p>
            )}
          </div>
          <input
            type="submit"
            className="shadow bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:shadow-outline text-white font-bold py-2 px-4 rounded cursor-pointer"
          ></input>
        </form>
      )}
      <div className="my-10 mx-auto flex max-w-2xl flex-col space-y-2 p-10 shadow  shadow-yellow-500">
        <h3 className="text-4xl">Comments</h3>
        <hr className="pb-2" />

        {post.comments.map((comment) => {
          return (
            <div key={comment._id}>
              <p>
                <span className="text-yellow-500">{comment.name}: </span>
                {comment.comment}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Post;

export const getStaticPaths = async () => {
  const query = `*[_type=='post']{
        _id,
        slug{
        current
      }
      }`;

  const posts = await sanityClient.fetch(query);

  const paths = posts.map((post: Post) => ({
    params: { slug: post.slug.current },
  }));

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type=='post' && slug.current==$slug][0]{
    _id,
    _createdAt,
    title,
    author->{
    name,
    image
  },
  'comments':*[
        _type=="comment" &&
        post._ref==^._id &&
        approved==true],
  description,
  mainImage,
  slug,
  body
  }`;

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  });

  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
    },
    revalidate: 60,
  };
};
