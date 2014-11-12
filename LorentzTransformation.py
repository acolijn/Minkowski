import math
import numpy as np

import matplotlib.pyplot as plt
#from os import listdir

###########################################################################################
###########################################################################################
###########################################################################################
class Barn:
    #documentation
    """
    Draw the barn for the ladder in barn paradox .....
    """
    def __init__(self, **kwargs):
        #documentation
        """
               Arguments for LorentzTransformation() constructor:

        :param kwargs:

        Input:
                L0 - rest length
                LT - LorentzTransformation
        """
        self.L0 = kwargs.pop('L0',1)
        self.LT = kwargs.pop('LT')

        self.barnx = np.array([0,   0,   0.25, 0.75, 1.0, 1.0])*self.L0
        self.barny = np.array([0.4, 0.5, 0.75, 0.75, 0.5, 0.4])
        self.botx = np.array([0,  0.0,  1.0, 1.0])*self.L0
        self.boty = np.array([-0.1, -0.15, -0.15, -0.1])


        self.frontdoorx = np.array([0.0,0.0])*self.L0
        self.frontdoory = np.array([-0.1,0.4])

        self.backdoorx = np.array([1.0,1.0])*self.L0
        self.backdoory = np.array([-0.1,0.4])

        return

    def draw(self,ct,inRest):
        scale = 1
        if inRest:
            ctA = ct
            ctB = ct
            gamma = 1
            beta  = 0
        else:
            gamma = self.LT.gamma
            beta  = self.LT.beta
            xA = np.array([ct,self.frontdoorx[0]-beta*ct,0,0])
            ctA = self.LT.transform(x=xA,inverse=True)[0]
            xB = np.array([ct,self.backdoorx[0]/gamma-beta*ct,0,0])
            ctB = self.LT.transform(x=xB,inverse=True)[0]

        plt.plot(self.barnx/gamma-beta*ct,self.barny+ct,color='green',linewidth=3)
        plt.plot(self.botx/gamma-beta*ct,self.boty+ct,color='green',linewidth=3)


        if ctA>=0:
            plt.plot(self.frontdoorx/gamma-beta*ct,self.frontdoory+ct,color='green',linewidth=3)
        if ctB<0:
            plt.plot(self.backdoorx/gamma-beta*ct,self.backdoory+ct,color='green',linewidth=3)


class Ladder:
    #documentation
    """
    Draw the ladder for the ladder in barn paradox .....
    """
    def __init__(self, **kwargs):
        #documentation
        """
          Arguments for LorentzTransformation() constructor:

        :param kwargs:

        Input:
                L0 - rest length
                LT - LorentzTransformation
        """
        self.L0 = kwargs.pop('L0',1)
        self.LT = kwargs.pop('LT')

        self.ladderx = np.array([0.0, 1.0])*self.L0
        self.laddery = np.array([0.0, 0.0])

        self.h    = 0.2
        self.step = 0.05*self.L0

        return

    def draw(self,ct,inRest):
        if inRest:
            gamma = 1
            beta  = 0
        else:
            gamma = self.LT.gamma
            beta  = self.LT.beta

        plt.plot(self.ladderx/gamma+beta*ct,self.laddery+ct,color='green',linewidth=4)
        plt.plot(self.ladderx/gamma+beta*ct,self.laddery+ct+self.h,color='green',linewidth=4)

        for i in range(1,20):
            plt.plot([i*self.step/gamma+beta*ct,i*self.step/gamma+beta*ct],
                     [self.laddery+ct,self.laddery+ct+self.h],color='green',linewidth=2)


class LorentzTransformation:
    #documentation
    """
    Initialize Lorentz Transformation class .....
    """

    def __init__(self, **kwargs):
        #documentation
        """
            Arguments for LorentzTransformation() constructor:

        :param kwargs:

            Input:
            beta        - v/c
             - or -
            gamma       - 1/sqrt(1-beta^2)
            """
        beta = kwargs.pop('beta', -1)
        gamma = kwargs.pop('gamma', -1)

        if gamma < 0:
            gamma = 1 / math.sqrt(1 - beta ** 2)
        elif beta < 0 and gamma > 0:
            beta = math.sqrt(1 - 1 / gamma ** 2)
        else:
            print('ERROR:: bad combination... beta = ', beta, ' gamma = ', gamma)

        self.beta  = beta
        self.gamma = gamma
        self.lims  = [-1,1,-1,1]
        self.size  = 8
        self.scale = 10


        return

    #_____________________________________________________________________________#
    def transform(self, **kwargs):
        #documentation
        """
            Lorentz transformation along the x-axis

            Arguments for transform() constructor:
        x       - 4-vector with format (ct,x,y,z)
        inverse - inverse Lorentz transform
            """

        x = kwargs['x']
        inverse = kwargs.pop('inverse', 0)
        pm = (1 - 2 * inverse)

        b = self.beta
        g = self.gamma

        xt = np.zeros(4)
        xt[0] = g * (x[0] - pm * b * x[1])
        xt[1] = g * (x[1] - pm * b * x[0])
        xt[2] = x[2]
        xt[3] = x[3]

        return xt

    #_____________________________________________________________________________#

    def drawAxes(self,**kwargs):
        #documentation
        """
            Draw Minkowski base diagram

            Arguments for transform() constructor:
        range      - plot limits (xmin,xmax,ctmin,ctmax)
        size       - size of the plot
        scale      - how many axes to be drawn in S' system
        plotInverse    - True if you draw the inverse LT
            """
        self.lims   = kwargs.pop('range',self.lims)
        self.scale  = kwargs.pop('scale',self.scale)
        plotInverse = kwargs.pop('plotInverse',False)
        plotGrid    = kwargs.pop('plotGrid',True)

        size  = self.size
        scale = self.scale

        xmin  = self.lims[0]
        xmax  = self.lims[1]
        ctmin = self.lims[2]
        ctmax = self.lims[3]

        # plot range
        plt.xlim([xmin, xmax])
        plt.ylim([ctmin, ctmax])

        # plot coordinate system

        if plotInverse:
            color1 = 'red'
            color2 = 'black'
            imode  = False
        else:
            color1 = 'black'
            color2 = 'red'
            imode = True

        # axes of equal x
        for x in np.arange(scale * xmin, scale * xmax + 1, 1):
            width = 1
            if x == 0:
                width = 3

            if plotGrid or x==0:
                # axes of x=C
                plt.plot([x, x], [ctmin, ctmax], linestyle='-', color=color1, linewidth=width)
                # axes of x'=C
                plt.plot([self.transform(x=[scale * ctmin, x, 0, 0], inverse=imode)[1],self.transform(x=[scale * ctmax, x, 0, 0], inverse=imode)[1]],
                         [self.transform(x=[scale * ctmin, x, 0, 0], inverse=imode)[0],self.transform(x=[scale * ctmax, x, 0, 0], inverse=imode)[0]],
                         linestyle='-', color=color2, linewidth=width)

        # axes of equal t
        for ct in np.arange(scale * ctmin, scale * ctmax + 1, 1):
            width = 1
            lstyle = '-.'
            if ct == 0:
                width = 3
                lstyle = '-'

            if plotGrid or ct==0:

                # axes of ct=C
                plt.plot([xmin, xmax], [ct, ct], linestyle=lstyle, color=color1, linewidth=width)
                # axes of ct'=C
                plt.plot([self.transform(x=[ct, scale * xmin, 0, 0], inverse=imode)[1],self.transform(x=[ct, scale * xmax, 0, 0], inverse=imode)[1]],
                         [self.transform(x=[ct, scale * xmin, 0, 0], inverse=imode)[0],self.transform(x=[ct, scale * xmax, 0, 0], inverse=imode)[0]],
                         linestyle=lstyle, color=color2, linewidth=width)

        # plot axis label
        if not plotInverse:
            plt.xlabel('$x$',fontsize=18)
            plt.ylabel('$ct$',fontsize=18)
        else:
            plt.xlabel('$x^{\prime}$',fontsize=18)
            plt.ylabel('$ct^{\prime}$',fontsize=18)

        # plot ticks
        if not plotGrid:
            for x in np.arange(-xmin*scale,xmax*scale,1):
                plt.plot(x,0,'o',color='black',markersize=8)
                plt.plot(0,x,'o',color='black',markersize=8)

                plt.plot(self.transform(x=[0,x,0,0],inverse=True)[0],self.transform(x=[0,x,0,0],inverse=True)[1],'o',color='red',markersize=8)
                plt.plot(self.transform(x=[0,x,0,0],inverse=True)[1],self.transform(x=[0,x,0,0],inverse=True)[0],'o',color='red',markersize=8)


        return
    #_____________________________________________________________________________#

    def drawLightCone(self):
        # draw the positive and negative lightcones....

        plt.plot([-100,  100],[-100, 100],'-',color='blue',linewidth=2)
        plt.plot([-100,  100],[ 100,-100],'-',color='blue',linewidth=2)

        return
    #_____________________________________________________________________________#
    def drawInvariant(self,**kwargs):

        xmin = self.lims[0]
        xmax = self.lims[1]
        ctmin = self.lims[2]
        ctmax = self.lims[3]
        s2 = kwargs.pop('s2',0)

        if   s2 > 0:
            x  = np.arange(xmin,xmax,0.1)
            ct = np.sqrt(s2+x**2)
            plt.plot(x,+ct,color='green')
            plt.plot(x,-ct,color='green')
        elif s2 < 0:
            ct = np.arange(ctmin,ctmax,0.1)
            x  = np.sqrt(ct**2-s2)
            plt.plot(+x,ct,color='green')
            plt.plot(-x,ct,color='green')

        return


