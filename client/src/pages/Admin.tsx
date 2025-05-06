import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

const uploadFileSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  file: z.instanceof(FileList).refine(files => files.length > 0, 'File is required'),
});

type UploadFileValues = z.infer<typeof uploadFileSchema>;

const Admin: React.FC = () => {
  const [_, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('uploads');

  // Check admin access
  const isAdmin = isAuthenticated && user?.role === 'admin';
  
  if (!isAuthenticated) {
    navigate('/');
    return null;
  }
  
  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg">
        <Card className="w-[350px] bg-dark-surface text-light-text">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-light-text-secondary mb-4">You do not have admin privileges.</p>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-light-text p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <Button variant="outline" onClick={() => navigate('/')}>
              <i className="fas fa-arrow-left mr-2"></i> Back to App
            </Button>
          </div>
          <p className="text-light-text-secondary">Manage research documents, users, and chat history.</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-8 w-full max-w-md">
            <TabsTrigger value="uploads">Research Uploads</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="chats">Chat Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="uploads">
            <ResearchUploadsTab />
          </TabsContent>
          
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="chats">
            <ChatsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ResearchUploadsTab: React.FC = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch research documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/admin/documents'],
  });
  
  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/admin/documents', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded successfully",
        description: "The document is now available in the research database.",
      });
      form.reset();
      // Refetch documents
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading the document.",
        variant: "destructive",
      });
    },
  });
  
  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest('DELETE', `/api/admin/documents/${documentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "The document has been removed from the database.",
      });
      // Refetch documents
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion failed",
        description: error.message || "There was an error deleting the document.",
        variant: "destructive",
      });
    },
  });
  
  const form = useForm<UploadFileValues>({
    resolver: zodResolver(uploadFileSchema),
    defaultValues: {
      title: '',
      author: '',
      category: '',
      description: '',
    },
  });
  
  const onSubmit = async (values: UploadFileValues) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('author', values.author);
      formData.append('category', values.category);
      if (values.description) {
        formData.append('description', values.description);
      }
      formData.append('file', values.file[0]);
      
      await uploadMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle>Research Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center p-8 text-light-text-secondary">
                <p>No documents have been uploaded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>{doc.author}</TableCell>
                        <TableCell>{doc.category}</TableCell>
                        <TableCell>{new Date(doc.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm">
                            <i className="fas fa-download mr-1"></i> Download
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteMutation.mutate(doc.id)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text">Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Document title" 
                          className="bg-dark-card border-dark-border text-light-text" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text">Author</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Author name" 
                          className="bg-dark-card border-dark-border text-light-text" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text">Category</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Document category" 
                          className="bg-dark-card border-dark-border text-light-text" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text">Description (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief description" 
                          className="bg-dark-card border-dark-border text-light-text" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-light-text">File</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          className="bg-dark-card border-dark-border text-light-text" 
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-islamic-green hover:bg-islamic-dark"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt mr-2"></i> Upload Document
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const UsersTab: React.FC = () => {
  const { toast } = useToast();
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });
  
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number, data: any }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      });
      // Refetch users
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the user.",
        variant: "destructive",
      });
    },
  });
  
  const handleToggleSubscription = (userId: number, currentTier: string, newTier: string) => {
    updateUserMutation.mutate({
      userId,
      data: { subscriptionTier: newTier }
    });
  };
  
  return (
    <Card className="bg-dark-surface border-dark-border">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-8 text-light-text-secondary">
            <p>No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.subscriptionTier === 'free' ? 'bg-gray-700 text-gray-300' :
                        user.subscriptionTier === 'basic' ? 'bg-islamic-green text-white' :
                        user.subscriptionTier === 'research' ? 'bg-islamic-gold text-dark-bg' :
                        'bg-blue-600 text-white'
                      }`}>
                        {user.subscriptionTier}
                      </span>
                    </TableCell>
                    <TableCell>{user.messageCount}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleSubscription(
                          user.id,
                          user.subscriptionTier,
                          user.subscriptionTier === 'free' ? 'basic' : 'free'
                        )}
                      >
                        <i className={`fas fa-${user.subscriptionTier === 'free' ? 'arrow-up' : 'arrow-down'} mr-1`}></i>
                        {user.subscriptionTier === 'free' ? 'Upgrade' : 'Downgrade'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ChatsTab: React.FC = () => {
  // Fetch chat logs
  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['/api/admin/chats'],
  });
  
  return (
    <Card className="bg-dark-surface border-dark-border">
      <CardHeader>
        <CardTitle>Chat History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center p-8 text-light-text-secondary">
            <p>No chat history found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.map((chat: any) => (
                  <TableRow key={chat.id}>
                    <TableCell>{chat.id}</TableCell>
                    <TableCell>{chat.user?.username || 'Anonymous'}</TableCell>
                    <TableCell className="font-medium">{chat.title || 'Untitled'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        chat.category === 'ahkam' ? 'bg-islamic-green text-white' :
                        chat.category === 'sukoon' ? 'bg-blue-600 text-white' :
                        chat.category === 'research' ? 'bg-islamic-gold text-dark-bg' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {chat.category}
                      </span>
                    </TableCell>
                    <TableCell>{chat.messageCount}</TableCell>
                    <TableCell>{new Date(chat.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <i className="fas fa-eye mr-1"></i> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Admin;
