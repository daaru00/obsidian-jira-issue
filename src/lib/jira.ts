/* eslint-disable @typescript-eslint/no-explicit-any */
import JiraIssuePluginSettings from '../settings'
import { request } from 'https'
import { join } from 'path'

export interface JiraIssue {
  id: string;
  key: string;
  project: JiraProject,
  summary: string;
  status: string;
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

export interface JiraIssueTransitions {
  id: string;
  name: string;
}

export interface JiraWorkLog {
  id: string;
  timeSpent: string;
  timeSpentSeconds: number;
  isOwner: boolean;
  startedAt: Date|null;
  updatedAt: Date|null;
}

export interface JiraUser {
  displayName: string;
  emailAddress: string;
}

function formatDoc(content: string) {
  return {
    'version': 1,
    'type': 'doc',
    'content': [
      {
        'type': 'paragraph',
        'content': [
          {
            'type': 'text',
            'text': content
          }
        ]
      }
    ]
  }
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
          Buffer.from(this.settings.email + ':' + this.settings.token).toString('base64'),
        'Content-Type': 'application/json'
      }
    }

    return new Promise((resolve, reject) => {
      let resData = ''

      const req = request(options, (res) => {
        res.on('data', (chunk) => {
          resData += chunk
        })

        res.on('error', (error) => {
          reject(error)
        })

        res.on('end', () => {
          resData = resData.trim()

          if (res.statusCode < 200 || res.statusCode > 299) {
            let err = ''
            try {
              err = JSON.parse(resData)
            } catch (error) {
              err = `Status code ${res.statusCode}`
            }
            return reject(err)
          }

          resolve(resData ? JSON.parse(resData) : '')
        })
      })
      
      req.on('error', (error) => {
        reject(error)
      })

      if (['POST', 'PUT'].includes(method.toLocaleUpperCase()) && data) {
        req.write(JSON.stringify(data))
      }

      req.end()
    })    
  }

  async getUser(): Promise<JiraUser> {
    const res = await this.callApi('GET', 'myself')

    return {
      displayName: res.displayName,
      emailAddress: res.emailAddress
    }
  }

  async getIssueDetails(jiraIssueIdOrKey: string): Promise<JiraIssue> {
    const res = await this.callApi('GET', join('issue', jiraIssueIdOrKey)+'?fields=id,key,summary,timetracking,project,status')
    
    return {
      id: res.id,
      key: jiraIssueIdOrKey,
      project: {
        id: res.fields.project.id,
        key: res.fields.project.key,
        name: res.fields.project.name,
      },
      summary: res.fields.summary,
      status: res.fields.status.name,
      timeTracking: res.fields.timetracking
    }
  }

  async getIssueTransitions(jiraIssueIdOrKey: string): Promise<JiraIssueTransitions[]> {
    const res = await this.callApi('GET', join('issue', jiraIssueIdOrKey, 'transitions'))
    res.transitions = res.transitions || []

    return res.transitions.map((transition: any): JiraIssueTransitions => ({
      id: transition.id,
      name: transition.name,
    }))
  }

  async transitionIssue(jiraIssueIdOrKey: string, transitionId: string): Promise<void> {
    await this.callApi('POST', join('issue', jiraIssueIdOrKey, 'transitions'), {
      transition: {
        id: transitionId
      }
    })
  }

  async saveIssueWorkLog(jiraIssueIdOrKey: string, timeSpent: string, startedAt: Date, timeRemaining: string, comment?: string): Promise<void> {
    let data: any = {
      comment: formatDoc(comment),
      timeSpent,
      started: startedAt.toISOString().replace('Z','+0000'),
    }

    if (timeRemaining.trim() !== '' && timeRemaining !== '0m') {
      data = {
        ...data,
        adjustEstimate: 'new',
        newEstimate: timeRemaining
      }
    }    

    await this.callApi('POST', join('issue', jiraIssueIdOrKey, 'worklog?notifyUsers=false'), data)
  }
}
