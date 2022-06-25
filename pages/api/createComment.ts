// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import sanityClient from '@sanity/client';

const config={
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    useCdn: process.env.NODE_ENV === 'production',
    token: process.env.SANITY_API_TOKEN,
};

const client = sanityClient(config);

export default function createComment(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const {_id, comment,name,email} = JSON.parse(req.body);

    try{
         client.create({
            _type: 'comment',
            post:{
                _ref: _id,
                _type: 'reference'
            },
            name,
            email,
            comment,
            
        });
    }catch(err){
        return res.status(500).json({message: 'Comment not created',err});
    };

    console.log('Comment created');
    return res.status(200).json({message: 'Comment created'});


}
