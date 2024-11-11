"use client"
import * as React from 'react';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import csvToJson from 'csvtojson';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
    subject: z.string().min(4),
    message: z.string().min(10),
});


const columns: GridColDef[] = [
//   { field: 'ID', headerName: 'ID', width: 40 },
  { 
    field: 'Name', 
    headerName: 'Name', 
    width: 150 ,
    sortable: false,
    disableColumnMenu: true,
  },
  {
    field: 'Linkedin URL',
    headerName: 'Linkedin URL',
    sortable: false,
    disableColumnMenu: true,
    width: 350,
    valueGetter: (value, row) => `${row['Linkedin URL'] || ''}`,
  },
  {
    field: 'Email Address',
    headerName: 'Email Address',
    sortable: false,
    disableColumnMenu: true,
    width: 350,
    valueGetter: (value, row) => `${row['Email Address'].replace(/,/g, '').split(' ')[0] || ''}`,
  },
  {
    field: 'Send',
    headerName: 'Send',
    sortable: false,
    disableColumnMenu: true,
    width: 100,
  },
];

type TClient = {
    ID: string
    Name: string
    'Company Name': string
    Address: string
    'Linkedin URL': string
    'Email Address': string
    'Social Info': string
    GitHub: string
    Send: string
}

export default function Home() {

    const [jsonData, setJsonData] = React.useState<TClient[]>([]);
    const [selectedEmails, setSelectedEmails] = React.useState<string[]>([]);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subject: '',
            message: '',
        },
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const csvData = e.target?.result as string;
                const jsonArray = await csvToJson().fromString(csvData);
                setJsonData(jsonArray);
            }
            reader.readAsText(file);
        }
    };

    const handleSelectChange = ( event: GridRowSelectionModel ) => {
        setSelectedEmails(event as string[]);
    }
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        await Promise.all(selectedEmails.map(async (emailID) => {
            const client = jsonData.find((row) => row['ID'] === emailID);
            if (client) {
                const email = client['Email Address'].replace(/,/g, '').split(' ')[0] ;
                const sendData = new FormData();
                sendData.append('email', email);
                sendData.append('subject', data.subject);
                const message = `<pre>Dear ${client['Name'].split(' ')[0]},</pre><pre>${data.message}</pre>`;
                sendData.append('message', message);
                try {
                    const response = await fetch('/api/mail-send', {
                        method: 'post',
                        body: sendData,
                    });
                    if (!response.ok) {
                        const errorText = await response.text(); 
                        throw new Error(`Server responded with status: ${response.status}, Message: ${errorText}`);
                    }
                    const responseData = await response.json();
                    console.log(responseData['message']);
    
                    setJsonData((prevData) => prevData.map((item) => 
                        item.ID === emailID ? { ...item, Send: 'Sent' } : item
                    ));
                } catch (err) {
                    console.error(err);
                }
            }
        }));
    };

    return (
        <div className="flex w-full h-full gap-4">
            <div className="w-full flex flex-col overflow-hidden">
                <Input type="file" accept=".csv" onChange={handleFileChange} className="flex align-center mb-3" />
                <DataGrid
                    rows={jsonData.filter((row) => row['Email Address'] !== '')}
                    columns={columns}
                    getRowId={(row) => row.ID}
                    initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
                    pageSizeOptions={[10, 30, { value: 100, label: 'All' }]}
                    checkboxSelection
                    onRowSelectionModelChange={handleSelectChange}
                />
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-[500px] space-y-3 mt-4">
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Type your Subject here."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Message</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Type your Message here."
                                        rows={25}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full">Send message</Button>
                </form>
            </Form>
        </div>
    );
}
