/* eslint-disable @typescript-eslint/no-explicit-any */
import JiraIssuePluginSettings from '../settings'
import { request } from 'https'
import { join } from 'path'

export interface JiraIssue {
  id: string;
  key: string;
  project: JiraProject,
  summary: string;
  timeTracking: JiraIssueTracking;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraIssueTracking {
  originalEstimate: string;
  originalEstimateSeconds: number;
  remainingEstimate: string;
  remainingEstimateSeconds: number;
  timeSpent: string;
  timeSpentSeconds: number;
}

export interface JiraWorkLog {
  id: string;
  timeSpent: string;
  timeSpentSeconds: number;
  isOwner: boolean;
  startedAt: Date|null;
  updatedAt: Date|null;
}

export default class JiraClient {
  settings: JiraIssuePluginSettings

  constructor(settings: JiraIssuePluginSettings) {
    this.settings = settings
  }

  async callApi(method: string, path: string, data: any = {}): Promise<any> {
    const options = {
      hostname: this.settings.host,
      port: 443,
      path: join('/rest/api/3/', path),
      method: method,
      headers: {
        'Authorization': 'Basic ' + 
          Buffer.from(this.settings.email + ':' + this.settings.token).toString('base64')
      }
    };    

    return new Promise((resolve, reject) => {
      let resData = ''

      const req = request(options, (res) => {
        res.on('data', (chunk) => {
          resData += chunk
        })

        res.on('error', (error) => {
          reject(error);
        })

        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode > 299) {
            return reject(resData)
          }

          resolve(JSON.parse(resData))
        })
      })
      
      req.on('error', (error) => {
        reject(error);
      })

      if (['POST', 'PUT'].includes(method.toLocaleUpperCase()) && data) {
        req.write(data)
      }

      req.end()
    })    
  }

  async getIssueDetails(jiraIssueIdOrKey: string): Promise<JiraIssue> {
    const res = await this.callApi('GET', join('issue', jiraIssueIdOrKey)+'?fields=id,key,summary,timetracking,project')
    console.log(res);

    return {
      id: res.id,
      key: jiraIssueIdOrKey,
      project: {
        id: res.fields.project.id,
        key: res.fields.project.key,
        name: res.fields.project.name,
      },
      summary: res.fields.summary,
      timeTracking: res.fields.timetracking
    }
  }

  async getIssueWorkLogs(jiraIssueIdOrKey: string): Promise<JiraWorkLog[]> {
    const res = await this.callApi('GET', join('issue', jiraIssueIdOrKey, 'worklog'))
    res.worklogs = res.worklogs || []

    return res.worklogs.map((worklog: any): JiraWorkLog => ({
      id: worklog.id,
      isOwner: worklog.author.emailAddress === this.settings.email,
      timeSpent: worklog.timeSpent,
      timeSpentSeconds: worklog.timeSpentSeconds,
      startedAt: worklog.started ? new Date(worklog.started) : null,
      updatedAt: worklog.updated ? new Date(worklog.updated) : null
    }))
  }
}
