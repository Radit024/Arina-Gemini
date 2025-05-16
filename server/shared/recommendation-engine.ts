import { AnalysisResult, ChatMessage } from "./schema";

// Types for recommendation engine
export interface RecommendationInput {
  userId: string;
  analysisResults: AnalysisResult[];
  chatHistory: ChatMessage[];
  currentSeason?: 'spring' | 'summer' | 'fall' | 'winter';
}

export interface RecommendationItem {
  id: string;
  type: 'crop' | 'business' | 'resource' | 'market';
  title: string;
  description: string;
  confidence: number; // 0-1 score indicating confidence level
  data: any; // Supporting data for the recommendation
  source: 'analysis' | 'chat' | 'pattern' | 'seasonal'; // Source of the recommendation
  createdAt: Date;
}

export interface RecommendationSet {
  id: string;
  userId: string;
  recommendations: RecommendationItem[];
  summary: string;
  createdAt: Date;
}

// Helper functions for recommendation generation

/**
 * Sort analysis results by recency, most recent first
 */
function sortByRecency(results: AnalysisResult[]): AnalysisResult[] {
  return [...results].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA; // Descending order (newest first)
  });
}

/**
 * Extract key insights from business feasibility analysis
 */
function extractBusinessRecommendations(results: AnalysisResult[]): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  
  // Filter for business feasibility analyses and sort by recency
  const businessResults = sortByRecency(results.filter(r => r.type === 'business_feasibility'));
  
  // Limit to most recent analyses to avoid overwhelming with recommendations
  const recentBusinessResults = businessResults.slice(0, 3);
  
  recentBusinessResults.forEach(result => {
    const data = result.data as any;
    
    // Check profitability indicators
    if (data.profitMargin && data.profitMargin > 0.25) {
      recommendations.push({
        id: `biz-profit-${result.id}`,
        type: 'business',
        title: 'Profitable Business Model',
        description: `Your ${data.businessName} shows a strong profit margin of ${(data.profitMargin * 100).toFixed(1)}%. Consider scaling operations while maintaining current cost structure.`,
        confidence: 0.8,
        data: {
          profitMargin: data.profitMargin,
          roi: data.roi,
          businessName: data.businessName
        },
        source: 'analysis',
        createdAt: new Date()
      });
    }
    
    // Check ROI indicators
    if (data.roi && data.roi > 0.15) {
      recommendations.push({
        id: `biz-roi-${result.id}`,
        type: 'business',
        title: 'Strong Return on Investment',
        description: `Your investment in ${data.businessName} shows a ${(data.roi * 100).toFixed(1)}% ROI. Consider additional investment in similar ventures.`,
        confidence: 0.75,
        data: {
          roi: data.roi,
          paybackPeriod: data.paybackPeriod
        },
        source: 'analysis',
        createdAt: new Date()
      });
    }
    
    // Check cost structure
    if (data.operationalCosts && Array.isArray(data.operationalCosts)) {
      // Find highest cost category
      const sortedCosts = [...data.operationalCosts].sort((a, b) => b.amount - a.amount);
      if (sortedCosts.length > 0) {
        const highestCost = sortedCosts[0];
        const costPercentage = highestCost.amount / sortedCosts.reduce((sum, cost) => sum + cost.amount, 0);
        
        if (costPercentage > 0.3) {
          recommendations.push({
            id: `biz-cost-${result.id}`,
            type: 'resource',
            title: 'Cost Reduction Opportunity',
            description: `${highestCost.name} represents ${(costPercentage * 100).toFixed(1)}% of your operational costs. Reducing this could significantly improve profitability.`,
            confidence: 0.7,
            data: {
              costName: highestCost.name,
              costAmount: highestCost.amount,
              percentage: costPercentage
            },
            source: 'analysis',
            createdAt: new Date()
          });
        }
      }
    }
    
    // Check break-even metrics
    if (data.breakEvenUnits && data.monthlySalesVolume) {
      const breakEvenRatio = data.breakEvenUnits / data.monthlySalesVolume;
      if (breakEvenRatio < 0.5) {
        recommendations.push({
          id: `biz-breakeven-${result.id}`,
          type: 'business',
          title: 'Favorable Break-Even Point',
          description: `You reach break-even at just ${(breakEvenRatio * 100).toFixed(1)}% of your monthly sales volume. This gives you a safety margin in market fluctuations.`,
          confidence: 0.85,
          data: {
            breakEvenUnits: data.breakEvenUnits,
            monthlySalesVolume: data.monthlySalesVolume,
            ratio: breakEvenRatio
          },
          source: 'analysis',
          createdAt: new Date()
        });
      }
    }
  });
  
  return recommendations;
}

/**
 * Extract key insights from demand forecasting
 */
function extractForecastRecommendations(results: AnalysisResult[]): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  
  // Filter for forecast analyses and sort by recency
  const forecastResults = sortByRecency(results.filter(r => r.type === 'demand_forecast'));
  
  // Limit to most recent analyses to avoid overwhelming with recommendations
  const recentForecasts = forecastResults.slice(0, 3);
  
  recentForecasts.forEach(result => {
    const data = result.data as any;
    
    // Check for growth trend
    if (data.forecasted && Array.isArray(data.forecasted) && data.forecasted.length > 1) {
      const firstForecast = data.forecasted[0].forecast;
      const lastForecast = data.forecasted[data.forecasted.length - 1].forecast;
      const growthRate = (lastForecast - firstForecast) / firstForecast;
      
      if (growthRate > 0.1) {
        recommendations.push({
          id: `forecast-growth-${result.id}`,
          type: 'market',
          title: 'Growing Demand Trend',
          description: `Demand for ${data.productName} is projected to grow by ${(growthRate * 100).toFixed(1)}% over the forecast period. Consider increasing production capacity.`,
          confidence: 0.75,
          data: {
            productName: data.productName,
            growthRate: growthRate,
            firstForecast: firstForecast,
            lastForecast: lastForecast
          },
          source: 'analysis',
          createdAt: new Date()
        });
      } else if (growthRate < -0.1) {
        recommendations.push({
          id: `forecast-decline-${result.id}`,
          type: 'market',
          title: 'Declining Demand Alert',
          description: `Demand for ${data.productName} is projected to decline by ${(Math.abs(growthRate) * 100).toFixed(1)}% over the forecast period. Consider diversifying your product mix.`,
          confidence: 0.75,
          data: {
            productName: data.productName,
            declineRate: Math.abs(growthRate),
            firstForecast: firstForecast,
            lastForecast: lastForecast
          },
          source: 'analysis',
          createdAt: new Date()
        });
      }
    }
    
    // Check for seasonality
    if (data.chart && data.chart.historical && Array.isArray(data.chart.historical)) {
      const values = data.chart.historical.map((h: any) => h.value);
      const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
      const peaks = values.filter((v: number) => v > avg * 1.2).length;
      
      if (peaks >= 2) {
        recommendations.push({
          id: `forecast-seasonal-${result.id}`,
          type: 'market',
          title: 'Seasonal Demand Pattern',
          description: `${data.productName} shows seasonal demand patterns with ${peaks} peak periods. Plan inventory and production to align with these patterns.`,
          confidence: 0.7,
          data: {
            productName: data.productName,
            peakPeriods: peaks,
            averageDemand: avg
          },
          source: 'pattern',
          createdAt: new Date()
        });
      }
    }
    
    // Check forecast accuracy
    if (data.accuracy) {
      if (data.accuracy.mape && data.accuracy.mape < 10) {
        recommendations.push({
          id: `forecast-accuracy-${result.id}`,
          type: 'business',
          title: 'High Forecast Reliability',
          description: `Your ${data.productName} forecast has a high accuracy (MAPE: ${data.accuracy.mape.toFixed(1)}%). Use this forecast with confidence for planning.`,
          confidence: 0.8,
          data: {
            productName: data.productName,
            mape: data.accuracy.mape
          },
          source: 'analysis',
          createdAt: new Date()
        });
      } else if (data.accuracy.mape && data.accuracy.mape > 20) {
        recommendations.push({
          id: `forecast-inaccuracy-${result.id}`,
          type: 'business',
          title: 'Forecast Uncertainty Alert',
          description: `Your ${data.productName} forecast has a higher error rate (MAPE: ${data.accuracy.mape.toFixed(1)}%). Consider using more historical data or adjusting your forecast method.`,
          confidence: 0.7,
          data: {
            productName: data.productName,
            mape: data.accuracy.mape
          },
          source: 'analysis',
          createdAt: new Date()
        });
      }
    }
  });
  
  return recommendations;
}

/**
 * Extract key insights from optimization analyses
 */
function extractOptimizationRecommendations(results: AnalysisResult[]): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  
  // Filter for optimization analyses and sort by recency
  const optimizationResults = sortByRecency(results.filter(r => r.type === 'optimization'));
  
  // Limit to most recent analyses to avoid overwhelming with recommendations
  const recentOptimizations = optimizationResults.slice(0, 3);
  
  recentOptimizations.forEach(result => {
    const data = result.data as any;
    
    // Check solution feasibility
    if (data.feasible === true) {
      recommendations.push({
        id: `opt-feasible-${result.id}`,
        type: 'resource',
        title: 'Optimal Resource Allocation',
        description: `Your ${data.name} optimization model has a feasible solution with ${data.objectiveValue ? 'an objective value of ' + data.objectiveValue.toFixed(2) : 'optimized resource allocation'}.`,
        confidence: 0.9,
        data: {
          optimizationName: data.name,
          objectiveValue: data.objectiveValue
        },
        source: 'analysis',
        createdAt: new Date()
      });
      
      // Specific recommendations for resource allocation
      if (data.variables && Array.isArray(data.variables)) {
        // Find resources with high allocation
        const significantVariables = data.variables
          .filter((v: any) => v.value > 0)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 3);
          
        if (significantVariables.length > 0) {
          const varList = significantVariables
            .map((v: any) => `${v.name}: ${v.value.toFixed(2)}`)
            .join(', ');
            
          recommendations.push({
            id: `opt-resources-${result.id}`,
            type: 'resource',
            title: 'Key Resource Allocation',
            description: `Focus on these resources for optimal results: ${varList}`,
            confidence: 0.8,
            data: {
              optimizationName: data.name,
              topResources: significantVariables
            },
            source: 'analysis',
            createdAt: new Date()
          });
        }
      }
      
      // Check binding constraints
      if (data.constraints && Array.isArray(data.constraints)) {
        const bindingConstraints = data.constraints
          .filter((c: any) => c.slack === 0 || Math.abs(c.slack) < 0.001)
          .map((c: any) => c.name);
          
        if (bindingConstraints.length > 0) {
          recommendations.push({
            id: `opt-constraints-${result.id}`,
            type: 'business',
            title: 'Resource Bottlenecks Identified',
            description: `These factors are limiting your optimization: ${bindingConstraints.join(', ')}. Consider increasing these resources.`,
            confidence: 0.85,
            data: {
              optimizationName: data.name,
              bindingConstraints: bindingConstraints
            },
            source: 'analysis',
            createdAt: new Date()
          });
        }
      }
    } else if (data.feasible === false) {
      recommendations.push({
        id: `opt-infeasible-${result.id}`,
        type: 'business',
        title: 'Resource Constraints Too Tight',
        description: `Your ${data.name} optimization model doesn't have a feasible solution. Consider relaxing some constraints or adding more resources.`,
        confidence: 0.9,
        data: {
          optimizationName: data.name
        },
        source: 'analysis',
        createdAt: new Date()
      });
    }
  });
  
  return recommendations;
}

/**
 * Extract insights from chat history with AI
 */
function extractChatInsights(messages: ChatMessage[]): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  
  // Look for assistant messages that have specific keywords
  const keywordMap = {
    'increase': 'growth',
    'expand': 'growth',
    'grow': 'growth',
    'profit': 'profit',
    'revenue': 'profit',
    'cost': 'cost',
    'expense': 'cost',
    'save': 'cost',
    'risk': 'risk',
    'market': 'market',
    'demand': 'market',
    'customer': 'market',
    'season': 'seasonal',
    'weather': 'seasonal',
    'climate': 'seasonal',
    'resource': 'resource',
    'water': 'resource',
    'soil': 'resource',
    'fertilizer': 'resource',
    'pest': 'resource',
    'equipment': 'resource'
  };
  
  const categories = {
    growth: [] as string[],
    profit: [] as string[],
    cost: [] as string[],
    risk: [] as string[],
    market: [] as string[],
    seasonal: [] as string[],
    resource: [] as string[]
  };
  
  // Sort messages by recency (most recent first)
  const sortedMessages = [...messages]
    .filter(m => m.role === 'assistant')
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Most recent first
    });
  
  // Limit to the most recent 10 messages to keep recommendations fresh
  const recentMessages = sortedMessages.slice(0, 10);
  
  // Analyze assistant messages
  recentMessages.forEach(message => {
    const content = message.content.toLowerCase();
      
      // Check for keywords and categorize
      Object.entries(keywordMap).forEach(([keyword, category]) => {
        if (content.includes(keyword)) {
          // Find the sentence containing the keyword
          const sentences = message.content.split(/[.!?]+/);
          const relevantSentences = sentences.filter(s => 
            s.toLowerCase().includes(keyword)
          );
          
          if (relevantSentences.length > 0) {
            categories[category as keyof typeof categories].push(
              relevantSentences[0].trim()
            );
          }
        }
      });
    });
  
  // Create recommendations from most frequent categories
  Object.entries(categories).forEach(([category, sentences]) => {
    if (sentences.length > 0) {
      const topSentence = sentences[0]; // Take the first instance
      
      let type: 'crop' | 'business' | 'resource' | 'market';
      switch (category) {
        case 'growth':
        case 'profit':
          type = 'business';
          break;
        case 'market':
        case 'seasonal':
          type = 'market';
          break;
        case 'resource':
        case 'cost':
          type = 'resource';
          break;
        default:
          type = 'business';
      }
      
      const title = {
        growth: 'Growth Opportunity',
        profit: 'Profit Enhancement',
        cost: 'Cost Saving Opportunity',
        risk: 'Risk Management',
        market: 'Market Intelligence',
        seasonal: 'Seasonal Planning',
        resource: 'Resource Optimization'
      }[category];
      
      recommendations.push({
        id: `chat-${category}-${Date.now()}`,
        type,
        title: title || 'AI Insight',
        description: topSentence,
        confidence: 0.6, // Lower confidence for chat-derived insights
        data: {
          category,
          relatedSentences: sentences
        },
        source: 'chat',
        createdAt: new Date()
      });
    }
  });
  
  return recommendations;
}

/**
 * Add seasonal recommendations based on current season
 */
function addSeasonalRecommendations(
  currentSeason?: 'spring' | 'summer' | 'fall' | 'winter'
): RecommendationItem[] {
  if (!currentSeason) return [];
  
  const recommendations: RecommendationItem[] = [];
  
  const seasonalCrops: Record<string, string[]> = {
    spring: ['Corn', 'Soybeans', 'Rice', 'Cotton', 'Vegetables'],
    summer: ['Sunflower', 'Sorghum', 'Millet', 'Vegetables', 'Fruits'],
    fall: ['Winter Wheat', 'Barley', 'Rapeseed', 'Root vegetables'],
    winter: ['Planning', 'Equipment maintenance', 'Soil preparation']
  };
  
  const seasonalActivities: Record<string, string[]> = {
    spring: ['Planting', 'Soil preparation', 'Fertilizing', 'Pest management planning'],
    summer: ['Irrigation management', 'Pest control', 'Crop monitoring', 'Early harvest planning'],
    fall: ['Harvesting', 'Storage preparation', 'Market research', 'Winter crop planting'],
    winter: ['Equipment maintenance', 'Financial planning', 'Education', 'Crop planning']
  };
  
  // Add crop recommendation
  recommendations.push({
    id: `seasonal-crop-${Date.now()}`,
    type: 'crop',
    title: `${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Crop Recommendations`,
    description: `Consider focusing on these crops this ${currentSeason}: ${seasonalCrops[currentSeason].join(', ')}.`,
    confidence: 0.7,
    data: {
      season: currentSeason,
      recommendedCrops: seasonalCrops[currentSeason]
    },
    source: 'seasonal',
    createdAt: new Date()
  });
  
  // Add activity recommendation
  recommendations.push({
    id: `seasonal-activity-${Date.now()}`,
    type: 'business',
    title: `${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Activity Focus`,
    description: `Key activities for this ${currentSeason}: ${seasonalActivities[currentSeason].join(', ')}.`,
    confidence: 0.7,
    data: {
      season: currentSeason,
      recommendedActivities: seasonalActivities[currentSeason]
    },
    source: 'seasonal',
    createdAt: new Date()
  });
  
  return recommendations;
}

/**
 * Generate personalized recommendations based on user's historical data
 */
export function generateRecommendations(input: RecommendationInput): RecommendationSet {
  let allRecommendations: RecommendationItem[] = [];
  
  // Get the most recent analysis results (limited to last 10 for performance)
  const sortedResults = sortByRecency(input.analysisResults).slice(0, 10);
  
  // Extract insights from different data sources
  const businessRecs = extractBusinessRecommendations(sortedResults);
  const forecastRecs = extractForecastRecommendations(sortedResults);
  const optimizationRecs = extractOptimizationRecommendations(sortedResults);
  const chatRecs = extractChatInsights(input.chatHistory);
  const seasonalRecs = addSeasonalRecommendations(input.currentSeason);
  
  // Combine all recommendations
  allRecommendations = [
    ...businessRecs,
    ...forecastRecs,
    ...optimizationRecs,
    ...chatRecs,
    ...seasonalRecs
  ];
  
  // First sort by recency
  allRecommendations.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return dateB - dateA; // Most recent first
  });
  
  // Then sort by confidence (highest first) within the same day
  allRecommendations.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.toDateString() : '';
    const dateB = b.createdAt instanceof Date ? b.createdAt.toDateString() : '';
    
    // If from the same day, sort by confidence
    if (dateA === dateB) {
      return b.confidence - a.confidence;
    }
    // Otherwise keep the previous sort (by date)
    return 0;
  });
  
  // Limit to top 10 recommendations to avoid overwhelming the user
  const finalRecommendations = allRecommendations.slice(0, 10);
  
  // Generate a summary based on top recommendations
  const topRecs = finalRecommendations.slice(0, 5);
  let summary = "";
  
  if (topRecs.length > 0) {
    const businessRec = topRecs.find(r => r.type === 'business');
    const marketRec = topRecs.find(r => r.type === 'market');
    const resourceRec = topRecs.find(r => r.type === 'resource');
    const cropRec = topRecs.find(r => r.type === 'crop');
    
    // Count the different analysis types to provide context
    const analysisCounts = {
      business: input.analysisResults.filter(r => r.type === 'business_feasibility').length,
      forecast: input.analysisResults.filter(r => r.type === 'demand_forecast').length,
      optimization: input.analysisResults.filter(r => r.type === 'optimization').length
    };
    
    // Create a more tailored summary based on what analyses were performed
    if (analysisCounts.business > 0 || analysisCounts.forecast > 0 || analysisCounts.optimization > 0) {
      summary = `Based on your ${analysisCounts.business > 0 ? 'business feasibility analysis, ' : ''}${analysisCounts.forecast > 0 ? 'demand forecasting, ' : ''}${analysisCounts.optimization > 0 ? 'optimization analysis, ' : ''}we recommend: `;
    } else {
      summary = "Based on your historical data, we recommend: ";
    }
    
    if (businessRec) summary += businessRec.title + ". ";
    if (marketRec) summary += marketRec.title + ". ";
    if (resourceRec) summary += resourceRec.title + ". ";
    if (cropRec) summary += cropRec.title + ". ";
    
    if (input.currentSeason) {
      summary += `Consider adjusting your strategy for the ${input.currentSeason} season.`;
    }
  } else {
    summary = "Insufficient data for personalized recommendations. Continue using Arina to analyze your agricultural business for tailored insights.";
  }
  
  // Update the allRecommendations to be the limited set
  allRecommendations = finalRecommendations;
  
  return {
    id: `rec-set-${Date.now()}`,
    userId: input.userId,
    recommendations: allRecommendations,
    summary,
    createdAt: new Date()
  };
}