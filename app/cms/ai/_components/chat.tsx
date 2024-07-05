"use client";

import { useEffect, useRef } from 'react';
import { Message, useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import DashWrapper from "../../_components/DashWrapper";
import { PromptForm } from "./prompt_form";
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function Chat({ messages: initialMessages }: { messages: Message[] }) {
  // Initialize the chat hook with initial messages
  const { messages, input, handleInputChange, handleSubmit, setInput, isLoading, error } = useChat({
    initialMessages
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show a toast message if there is an error
  useEffect(() => {
    if (error) {
      toast(error.message);
    }
  }, [error]);

  // Scroll to the end of the messages whenever the messages array changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages]);

  // Function to render different tool invocations based on tool names
  const renderToolInvocation = (toolInvocation: any) => {
    const toolCallId = toolInvocation.toolCallId;
    const message = toolInvocation?.result?.message;
    const result = toolInvocation?.result?.result;

    switch (toolInvocation.toolName) {
      case 'create_site':
        return (
          <div>
            <div key={toolCallId} className='bg-blue-700 bg-opacity-10 text-sm whitespace-pre-wrap px-3 py-2 rounded-lg w-fit'>
              {message}
            </div>
            <div className="pt-[0.5rem]">
              {toolInvocation?.result && (
                <div className='flex gap-1'>
                  <Link href={`https://${toolInvocation?.result?.site_subdomain}.tsafi.xyz`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-1 w-4 h-4" />
                      Website
                    </Button>
                  </Link>
                  <Link href={`/cms/sites/${toolInvocation?.result?.site_id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-1 w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      case 'read_sites':
        return (
          <div>
            <div key={toolCallId} className='flex gap-2 flex-col bg-blue-700 bg-opacity-10 text-sm whitespace-pre-wrap px-3 py-2 rounded-lg w-fit'>
              <p>{message}</p>
            </div>
            <div className='flex gap-2 flex-wrap mt-[1rem]'>
              {result?.length > 0 && result.map((site: any) => (
                <Link key={site.site_id} href={`/cms/sites/${site.site_subdomain}`} prefetch={true} className="flex flex-col rounded-md w-[350px] hover:cursor-pointer transition-shadow duration-300" target='_blank'>
                  <Card className="flex flex-col px-[1rem] justify-between h-full py-[1rem]">
                    <div className='flex flex-col w-full justify-center items-start'>
                      <h2 className="text-lg font-bold">{site.site_name}</h2>
                      <p className="text-gray-400 pt-1 text-sm">{site.site_description}</p>
                    </div>
                    <div className="flex justify-between mt-2 items-center w-full">
                      <p className='text-xs px-2 py-1 rounded-full border bg-zinc-900 text-gray-300'>
                        {site.site_subdomain}.tsafi.xyz
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(site.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div >
        );
      case 'update_site_name':
      case 'update_sub_domain':
        return (
          <div key={toolCallId} className='bg-blue-700 bg-opacity-10 text-sm whitespace-pre-wrap px-3 py-2 rounded-lg w-fit'>
            {message && JSON.parse(result).map((info: any) => (
              <div key={info?.site_id}>
                {message + " "}
                {info?.site_name}: <Link href={`https://${info?.site_subdomain}.tsafi.xyz`} className="underline" target="_blank">{info?.site_subdomain + ".tsafi.xyz"}</Link>
              </div>
            ))}
          </div>
        );
      case 'generate_blog_image':
        return (
          <div key={toolCallId} className='bg-blue-700 bg-opacity-10 text-sm whitespace-pre-wrap p-2 rounded-lg w-fit'>
            <div>
              {toolInvocation?.result?.images?.[0]?.url ? <Image className='rounded' src={toolInvocation?.result?.images?.[0]?.url} width={500} height={300} alt="" /> : <Skeleton className='w-[500px] h-[300px]' />}
            </div>
          </div>
        );
      case 'generate_document_from_youtube':
        return toolInvocation?.result ? (
          <div key={toolCallId} className='bg-blue-700 bg-opacity-10 text-sm whitespace-pre-wrap p-2 rounded-lg w-fit'>
            {(toolInvocation?.result)}
          </div>
        ) : <Skeleton className='w-full max-w-[700px] h-[180px]' />

      default:
        return null;
    }
  };

  return (
    <DashWrapper>
      <div className="flex flex-col h-[calc(100vh-100px)] w-full">
        <div className="flex-grow overflow-y-auto p-4">
          {messages.map((m: any, index: number) => (
            <div key={index} className={m.role === "user" ? "flex flex-col justify-center items-end gap-1 mb-4" : "flex flex-col justify-center items-start gap-1 mb-4"}>
              <div className="flex flex-col gap-1 max-w-[80%]">
                <p className="text-sm text-left">
                  {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                </p>
                {m?.toolInvocations?.map(renderToolInvocation)}
                {m?.content && (
                  <div>
                    <div className='bg-blue-700 whitespace-pre-wrap bg-opacity-10 text-sm px-3 py-2 rounded-lg w-fit'>
                      {m?.content}
                    </div>
                    <div className='flex gap-2 flex-wrap w-full mt-2'>
                      {m?.type === "tool-result_read-site" && m?.result?.map((info: any, index: number) => (
                        <Link key={index} href={`/cms/sites/${info.site_subdomain}`} prefetch={true} className="flex flex-col rounded-md max-w-[350px] w-full min-h-[150px] hover:cursor-pointer transition-shadow duration-300" target='_blank'>
                          <Card className="flex flex-col px-[1rem] justify-between h-full py-[1rem]">
                            <div className='flex flex-col w-full justify-center items-start'>
                              <h2 className="text-lg font-bold">{info.site_name}</h2>
                              <p className="text-gray-400 pt-1 text-sm">{info.site_description}</p>
                            </div>
                            <div className="flex justify-between mt-2 items-center w-full">
                              <p className='text-xs px-2 py-1 rounded-full border bg-zinc-900 text-gray-300'>
                                {info.site_subdomain}.tsafi.xyz
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(info.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                    <div className='flex flex-col'>
                      {m?.type === "tool-result_generate_blog_image" && ((
                        <div>
                          {<Image className='rounded' src={m?.result?.url} width={500} height={300} alt="" />}
                        </div>
                      ))}
                    </div>
                    <div className='flex flex-col'>
                      {m?.type === "tool-result_generate_document_from_youtube" && ((
                        <div className='bg-blue-700 whitespace-pre-wrap bg-opacity-10 text-sm px-3 py-2 rounded-lg w-fit'>
                          {m?.result}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="px-4 pb-4">
          <PromptForm input={input} handleInputChange={handleInputChange} handleSubmit={handleSubmit} setInput={setInput} />
        </div>
      </div>
    </DashWrapper >
  );
}
